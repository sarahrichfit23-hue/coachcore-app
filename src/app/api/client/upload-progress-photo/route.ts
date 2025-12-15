import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";
import { generateFileKey, uploadToR2 } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ProgressView = "front" | "side" | "back";

function resolveSlot({ view, slot }: { view?: unknown; slot?: unknown }): {
  slot: 1 | 2 | 3;
  view: ProgressView;
} {
  if (view === "front") return { slot: 1, view: "front" };
  if (view === "side") return { slot: 2, view: "side" };
  if (view === "back") return { slot: 3, view: "back" };

  const numericSlot = Number(slot);
  if (numericSlot === 1) return { slot: 1, view: "front" };
  if (numericSlot === 2) return { slot: 2, view: "side" };
  return { slot: 3, view: "back" };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const phaseId = formData.get("phaseId");
    const slotRaw = formData.get("slot");
    const viewRaw = formData.get("view");
    const file = formData.get("file") as File | null;

    if (!phaseId || typeof phaseId !== "string") {
      return NextResponse.json(
        { success: false, error: "phaseId is required" },
        { status: 400 },
      );
    }

    const { slot, view } = resolveSlot({ view: viewRaw, slot: slotRaw });

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, or WEBP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    const progress = await prisma.progress.findUnique({
      where: { id: phaseId },
      select: {
        id: true,
        phaseNumber: true,
        photo1Url: true,
        photo2Url: true,
        photo3Url: true,
        clientProfile: { select: { userId: true } },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { success: false, error: "Progress phase not found" },
        { status: 404 },
      );
    }

    if (progress.clientProfile.userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const extension =
      file.name?.split(".").pop() || file.type.split("/")[1] || "jpg";
    const fileKey = generateFileKey(
      session.userId,
      progress.phaseNumber,
      slot,
      extension,
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(fileKey, buffer, file.type);

    const data: Record<string, string> = {};
    if (slot === 1) data.photo1Url = url;
    if (slot === 2) data.photo2Url = url;
    if (slot === 3) data.photo3Url = url;

    const updatedPhase = await prisma.progress.update({
      where: { id: phaseId },
      data,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedPhase.id,
          phaseNumber: updatedPhase.phaseNumber,
          frontImage: updatedPhase.photo1Url,
          sideImage: updatedPhase.photo2Url,
          backImage: updatedPhase.photo3Url,
          isCompleted: updatedPhase.isCompleted,
          updatedAt: updatedPhase.updatedAt,
          view,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload progress photo error", error);
    return NextResponse.json(
      { success: false, error: "Unable to upload photo" },
      { status: 500 },
    );
  }
}
