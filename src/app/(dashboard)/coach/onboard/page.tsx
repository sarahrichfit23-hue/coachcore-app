import { notFound, redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password";
import { getSession } from "@/lib/auth/token";

export default async function CoachOnboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "COACH") {
    notFound();
  }

  if (session.isPasswordChanged) {
    redirect("/coach");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f0] px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-3xl bg-white px-6 py-6 shadow-sm ring-1 ring-gray-200 sm:px-8">
          <p className="text-sm font-semibold text-[#b67b11]">
            Coach Onboarding
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Set your password to continue
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Secure your account before accessing your dashboard.
          </p>
        </div>

        <div className="rounded-3xl bg-white px-6 py-6 shadow-sm ring-1 ring-gray-200 sm:px-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
