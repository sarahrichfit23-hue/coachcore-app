"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPasswordResponse {
  success: boolean;
  data?: {
    role: "ADMIN" | "COACH" | "CLIENT";
    isPasswordChanged: boolean;
  };
  error?: string;
}

function getRedirectPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COACH":
      return "/coach";
    case "CLIENT":
      return "/client";
    default:
      return "/login";
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = (await response.json()) as ResetPasswordResponse;

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error ?? "Unable to reset password");
      }

      return data.data;
    },
    onSuccess: (data) => {
      const redirect = getRedirectPath(data.role);
      router.replace(redirect);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    await resetMutation.mutateAsync();
  };

  const isSubmitting = resetMutation.isPending;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-2 text-left">
        <p className="text-sm font-medium text-[#b67b11]">Security</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          Set a new password
        </h1>
        <p className="text-sm text-gray-600">
          Choose a strong password you will use to sign in going forward.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="pr-12"
              required
            />
            <button
              type="button"
              aria-label={showNew ? "Hide password" : "Show password"}
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700"
            >
              {showNew ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="pr-12"
              required
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700"
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full justify-center bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
