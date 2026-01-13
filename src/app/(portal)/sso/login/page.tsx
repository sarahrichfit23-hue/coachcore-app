"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SsoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const returnUrl = searchParams.get("return");

    if (!token) {
      setError("Missing SSO token");
      return;
    }

    // Verify SSO token and create session
    fetch("/api/auth/sso/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          success: boolean;
          data?: { returnUrl?: string | null };
          error?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "SSO authentication failed");
        }

        // Redirect to return URL or default portal page
        const redirectTo = returnUrl || data.data?.returnUrl || "/coach";
        router.push(redirectTo);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "SSO authentication failed";
        setError(message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Authentication Failed
          </h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-[#fcca56] px-6 py-2.5 font-medium text-gray-900 hover:bg-[#fbc041]"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#fcca56]" />
        <p className="text-lg font-medium text-gray-900">
          Authenticating via SSO...
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  );
}

export default function SsoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-[#fcca56]" />
        </div>
      }
    >
      <SsoLoginContent />
    </Suspense>
  );
}
