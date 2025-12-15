import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";
import { DocumentSectionList } from "@/components/documents/document-section-list";
import { type DocumentTemplate } from "@/types";

export default async function ClientDocumentEditPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "COACH") {
    notFound();
  }

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!coachProfile) {
    notFound();
  }

  const clientProfile = await prisma.clientProfile.findFirst({
    where: { id: clientId, coachId: coachProfile.id },
    select: {
      id: true,
      document: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!clientProfile) {
    notFound();
  }

  const document = clientProfile.document as DocumentTemplate | null;
  if (!document || !Array.isArray(document.sections)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">Editing document for</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {clientProfile.user.name}
        </h1>
        <p className="text-sm text-gray-600">{clientProfile.user.email}</p>
      </div>

      <DocumentSectionList clientId={clientProfile.id} document={document} />
    </div>
  );
}
