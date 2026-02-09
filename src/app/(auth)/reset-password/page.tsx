"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface UpdatePasswordResponse {
  success: boolean;
  message?: string;
  data?: {
    email: string;
  };
  error?: string;
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const router = useRouter();

  // Get Supabase client once at component level
  // Note: This is a stable singleton instance that won't cause re-renders
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Use IIFE pattern to handle async operations in useEffect
    (async () => {
      try {
        // Check for 'code' parameter first (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          // Exchange code for session
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            setError(
              "Invalid or expired reset link. Please request a new password reset.",
            );
            setIsLoadingToken(false);
            return;
          }

          // Get session to extract access token
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError || !sessionData?.session?.access_token) {
            console.error("Session retrieval error:", sessionError);
            setError(
              "Failed to establish session. Please request a new password reset.",
            );
            setIsLoadingToken(false);
            return;
          }

          setAccessToken(sessionData.session.access_token);
          setRefreshToken(sessionData.session.refresh_token);
          setIsLoadingToken(false);
          return;
        }

        // Check for access_token in URL hash (implicit flow)
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const token = hashParams.get("access_token");
          const refresh = hashParams.get("refresh_token");
          const tokenType = hashParams.get("type");

          // Verify it's a recovery token
          if (token && tokenType === "recovery") {
            // Verify the session is valid
            const { data: sessionData, error: sessionError } =
              await supabase.auth.getSession();

            if (sessionError || !sessionData?.session) {
              console.error("Session verification error:", sessionError);
              setError(
                "Invalid or expired reset link. Please request a new password reset.",
              );
              setIsLoadingToken(false);
              return;
            }

            setAccessToken(token);
            setRefreshToken(refresh);
            setIsLoadingToken(false);
            return;
          }
        }

        // Check for access_token in query params (alternative flow)
        const token = urlParams.get("access_token");
        if (token) {
          setAccessToken(token);
          const refresh = urlParams.get("refresh_token");
          if (refresh) {
            setRefreshToken(refresh);
          }
          setIsLoadingToken(false);
          return;
        }

        // No valid token found
        setError("Invalid or expired reset link. Please request a new one.");
        setIsLoadingToken(false);
      } catch (err) {
        console.error("Token extraction error:", err);
        setError("Failed to process reset link. Please try again.");
        setIsLoadingToken(false);
      }
    })();
  }, [supabase]);

  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      newPassword,
      confirmPassword,
      accessToken,
      refreshToken,
    }: {
      newPassword: string;
      confirmPassword: string;
      accessToken: string;
      refreshToken: string;
    }) => {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
          accessToken,
          refreshToken,
        }),
      });

      const data = (await response.json()) as UpdatePasswordResponse;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "Unable to update password");
      }

      return data;
    },
    onSuccess: (data) => {
      setError("");
      setSuccess(true);
      toast.success(data.message || "Password updated successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update password. Please try again.",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }

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

    try {
      await updatePasswordMutation.mutateAsync({
        newPassword,
        confirmPassword,
        accessToken,
        refreshToken,
      });
    } catch {
      // Error is already handled by onError callback
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
      style={{ backgroundColor: "#fcca56" }}
    >
      {/* Decorative background logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <Image
          src="/coach-core-logo-new.png"
          alt=""
          width={800}
          height={240}
          className="h-auto w-[60%] max-w-4xl"
          style={{ filter: "invert(1)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center">
            <Image
              src="/coach-core-logo-new.png"
              alt="Coach Core OS"
              width={200}
              height={60}
              className="h-auto w-48 md:w-56"
              priority
            />
          </div>
          <h2 className="mb-2 text-2xl font-light text-gray-800 md:text-4xl">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-700 md:text-base">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm md:p-10">
          {isLoadingToken ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
              </div>
              <p className="text-sm text-gray-600">
                Verifying your reset link...
              </p>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Password Updated!
              </h3>
              <p className="text-sm text-gray-600">
                Your password has been successfully updated.
                <br />
                Redirecting you to the login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 w-full border-gray-200 bg-gray-50 pr-12 text-base focus:border-gray-900 focus:ring-gray-900"
                    required
                    disabled={!accessToken || updatePasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700"
                    disabled={!accessToken}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full border-gray-200 bg-gray-50 pr-12 text-base focus:border-gray-900 focus:ring-gray-900"
                    required
                    disabled={!accessToken || updatePasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700"
                    disabled={!accessToken}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={
                  !accessToken ||
                  updatePasswordMutation.isPending ||
                  !newPassword ||
                  !confirmPassword
                }
                className="h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updatePasswordMutation.isPending
                  ? "Updating password..."
                  : "Set Password"}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-semibold text-gray-900 underline transition-colors hover:text-gray-700"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
