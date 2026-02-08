"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "Unable to send reset email");
      }

      return data;
    },
    onSuccess: () => {
      setError("");
      setSuccess(true);
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send reset email. Please try again.",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(email);
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
            Forgot Password?
          </h2>
          <p className="text-sm text-gray-700 md:text-base">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm md:p-10">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-600">
                If an account exists with this email, a password reset link has
                been sent.
                <br />
                <br />
                Please check your inbox and follow the instructions to reset
                your password.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="mt-4 w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full border-gray-200 bg-gray-50 text-base focus:border-gray-900 focus:ring-gray-900"
                  required
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending || !email}
                className="h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {forgotPasswordMutation.isPending
                  ? "Sending..."
                  : "Send Reset Link"}
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
