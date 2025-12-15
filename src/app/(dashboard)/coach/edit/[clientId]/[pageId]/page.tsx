import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";
import { findPageById } from "@/lib/document-template";
import { DocumentPageEditor } from "@/components/documents/document-page-editor";
import { type DocumentTemplate } from "@/types";
import { ArrowLeft } from "lucide-react";

export default async function ClientDocumentPage({
  params,
}: {
  params: Promise<{ clientId: string; pageId: string }>;
}) {
  const { clientId, pageId } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "COACH") {
    notFound();
  }

  const coachProfile = await prisma?.coachProfile?.findUnique({
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
      user: { select: { name: true } },
    },
  });

  if (!clientProfile || !clientProfile.document) {
    notFound();
  }

  const document = clientProfile.document as unknown as DocumentTemplate;
  const pageMatch = findPageById(document, pageId);

  if (!pageMatch) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/coach/edit/${clientProfile.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        Editing page for {clientProfile.user.name}
      </p>
      <DocumentPageEditor
        clientId={clientProfile.id}
        pageId={pageId}
        title={pageMatch.page.title}
        sectionName={pageMatch.sectionName}
        initialJson={pageMatch.page.json}
      />
    </div>
  );
}
