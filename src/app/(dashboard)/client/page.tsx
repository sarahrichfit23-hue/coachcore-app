import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/token";
import { prisma } from "@/lib/db";
import { ClientProgressTable } from "@/components/progress/client-progress-table";

export default async function ClientDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "CLIENT") {
    notFound();
  }

  if (!session.isPasswordChanged) {
    redirect("/client/onboard");
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    select: {
      coach: {
        select: {
          userId: true,
        },
      },
    },
  });

  const coachUserId = clientProfile?.coach?.userId;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white px-6 py-6 shadow-sm ring-1 ring-gray-200 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#b67b11]">
              Client Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Track your journey and stay in sync
            </h1>
            <p className="text-sm text-gray-600">
              Share progress photos each phase and keep your coach updated.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/client/view"
              className="inline-flex items-center justify-center rounded-xl bg-[#b67b11] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9d680e]"
            >
              View Document
            </Link>
            <Link
              href={
                coachUserId ? `/messages?contactId=${coachUserId}` : "/messages"
              }
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
            >
              Message Coach
            </Link>
          </div>
        </div>
      </div>

      <ClientProgressTable />
    </div>
  );
}
