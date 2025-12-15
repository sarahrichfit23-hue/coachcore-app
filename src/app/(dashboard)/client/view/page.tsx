import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { type DocumentTemplate } from "@/types";

export default async function ClientViewPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "CLIENT") {
    notFound();
  }

  const clientProfile = await prisma?.clientProfile?.findUnique({
    where: { userId: session.userId },
    select: {
      document: true,
      coach: { select: { user: { select: { name: true } } } },
    },
  });

  if (!clientProfile || !clientProfile.document) {
    notFound();
  }

  const document = clientProfile?.document as any as DocumentTemplate;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          Your program from {clientProfile.coach.user.name}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Document</h1>
      </div>
      <DocumentViewer document={document} />
    </div>
  );
}
