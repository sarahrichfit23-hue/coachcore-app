import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/storage";
import { getSession } from "@/lib/auth/token";

/**
 * POST /api/user/upload-avatar
 * Upload user avatar to R2 and return the URL
 *
 * Body: FormData with 'file' field
 * Response: { success: true, url: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPG, PNG, and GIF are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 2MB limit" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${session.userId}-${timestamp}.${ext}`;

    // Upload to R2
    const buffer = await file.arrayBuffer();
    const url = await uploadToR2(filename, Buffer.from(buffer), file.type);

    return NextResponse.json(
      {
        success: true,
        url,
        filename,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}
