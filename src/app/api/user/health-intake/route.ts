import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/token";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/user/health-intake
 * Submit health intake form data and store it in the client's document
 * under the "Intake Questionnaire" section
 *
 * Body: {
 *   fullName: string,
 *   dateOfBirth: string,
 *   phone: string,
 *   email: string,
 *   height: string,
 *   weight: string,
 *   medicalHistory: string,
 *   currentMedications: string,
 *   allergies: string,
 *   emergencyContactName: string,
 *   emergencyContactPhone: string,
 *   primaryGoals: string,
 *   additionalNotes: string
 * }
 * Response: { success: true, message: string } or { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      fullName,
      dateOfBirth,
      phone,
      email,
      height,
      weight,
      medicalHistory,
      currentMedications,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
      primaryGoals,
      additionalNotes,
    } = body;

    // Validate required fields
    if (!fullName || !dateOfBirth) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name and date of birth are required",
        },
        { status: 400 }
      );
    }

    // Get the client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, document: true },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { success: false, error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Get the current document structure
    const document = (clientProfile.document as any) || { sections: [] };

    // Find the "Intake Questionnaire" page
    let intakePage: any = null;
    let sectionIndex = -1;
    let pageIndex = -1;

    for (let i = 0; i < document.sections?.length; i++) {
      const section = document.sections[i];
      const foundPageIndex = section.pages?.findIndex(
        (page: any) => page.title?.toLowerCase() === "intake questionnaire"
      );

      if (foundPageIndex !== -1) {
        intakePage = section.pages[foundPageIndex];
        sectionIndex = i;
        pageIndex = foundPageIndex;
        break;
      }
    }

    if (!intakePage) {
      return NextResponse.json(
        {
          success: false,
          error: "Intake Questionnaire page not found in document structure",
        },
        { status: 404 }
      );
    }

    // Initialize page json if it doesn't exist
    if (!intakePage.json) {
      intakePage.json = {
        time: Date.now(),
        blocks: [],
        version: "2.31.0",
      };
    }

    if (!intakePage.json.blocks) {
      intakePage.json.blocks = [];
    }

    // Find the IntakeForm block
    const intakeFormBlockIndex = intakePage.json.blocks.findIndex(
      (block: any) => block.type === "IntakeForm"
    );

    if (intakeFormBlockIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "IntakeForm block not found in the page",
        },
        { status: 404 }
      );
    }

    // Update the IntakeForm block's componentInfo with the submitted data
    const intakeFormBlock = intakePage.json.blocks[intakeFormBlockIndex];
    if (!intakeFormBlock.data) {
      intakeFormBlock.data = {};
    }

    intakeFormBlock.data.componentInfo = {
      submittedAt: new Date().toISOString(),
      formData: {
        personalInfo: {
          fullName,
          dateOfBirth,
          phone: phone || "",
          email: email || "",
        },
        healthMetrics: {
          height: height || "",
          weight: weight || "",
        },
        medicalInfo: {
          medicalHistory: medicalHistory || "",
          currentMedications: currentMedications || "",
          allergies: allergies || "",
        },
        emergencyContact: {
          name: emergencyContactName || "",
          phone: emergencyContactPhone || "",
        },
        goals: {
          primaryGoals: primaryGoals || "",
          additionalNotes: additionalNotes || "",
        },
      },
    };

    // Update timestamp
    intakePage.json.time = Date.now();

    // Update the client profile with the modified document
    await prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: { document },
    });

    return NextResponse.json({
      success: true,
      message: "Health intake form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting health intake form:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit intake form. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/health-intake
 * Retrieve the health intake form data for the current user
 *
 * Response: { success: true, data: object } or { success: false, error: string }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      select: { document: true },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { success: false, error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Get the current document structure
    const document = (clientProfile.document as any) || { sections: [] };

    // Find the "Intake Questionnaire" page and IntakeForm block
    let intakeFormBlock: any = null;

    for (const section of document.sections || []) {
      const intakePage = section.pages?.find(
        (page: any) => page.title?.toLowerCase() === "intake questionnaire"
      );

      if (intakePage?.json?.blocks) {
        intakeFormBlock = intakePage.json.blocks.find(
          (block: any) => block.type === "IntakeForm"
        );
        if (intakeFormBlock) break;
      }
    }

    if (!intakeFormBlock || !intakeFormBlock.data?.componentInfo) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No intake form data found",
      });
    }

    return NextResponse.json({
      success: true,
      data: intakeFormBlock.data.componentInfo,
    });
  } catch (error) {
    console.error("Error retrieving health intake form:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve intake form data",
      },
      { status: 500 }
    );
  }
}
