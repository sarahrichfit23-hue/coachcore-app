import { ResetPasswordForm } from "@/components/auth/reset-password";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-4xl items-center justify-center space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Change Password
        </h1>
        <p className="text-gray-600">
          Update your password without leaving the dashboard.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <ResetPasswordForm
          endpoint="/api/auth/change-password"
          successRedirectPath="/settings"
          successMessage="Password updated successfully"
        />
      </div>
    </div>
  );
}
