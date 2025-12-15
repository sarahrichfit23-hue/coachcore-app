"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "@/providers";

type UserRole = "ADMIN" | "COACH" | "CLIENT";

interface LoginResponse {
  success: boolean;
  data?: {
    id: string;
    role: UserRole;
    isPasswordChanged: boolean;
  };
  error?: string;
}

function getPostLoginRedirect(role: UserRole, isPasswordChanged: boolean) {
  if (!isPasswordChanged) {
    if (role === "ADMIN") return "/admin/";
    if (role === "COACH") return "/coach/onboard";
    return "/client";
  }

  if (role === "ADMIN") return "/admin/";
  if (role === "COACH") return "/coach/";
  return "/client";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = useSession();

  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data?.success || !data.data) {
        throw new Error(data?.error ?? "Invalid credentials");
      }

      return data.data;
    },
    onSuccess: async ({ role, isPasswordChanged }) => {
      setError("");
      await refetchSession();
      queryClient.invalidateQueries();
      const redirectPath = getPostLoginRedirect(role, isPasswordChanged);
      router.push(redirectPath);
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    },
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    await loginMutation.mutateAsync({ email, password });
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
        {/* Logo and Tagline */}
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
            Coach, grow, transform
          </h2>
          <p className="text-sm text-gray-700 md:text-base">
            Empower your clients with
            <br />
            personalized guidance
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm md:p-10">
          <form onSubmit={handleSignIn} className="space-y-6">
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
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full border-gray-200 bg-gray-50 text-base focus:border-gray-900 focus:ring-gray-900"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full border-gray-200 bg-gray-50 pr-12 text-base focus:border-gray-900 focus:ring-gray-900"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>

            {/* Sign Up Link */}
            {/* <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-gray-900 underline transition-colors hover:text-gray-700"
              >
                Sign up
              </Link>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
