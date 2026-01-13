"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PortalAccessButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePortalAccess = async () => {
    try {
      setIsLoading(true);

      // Generate SSO token
      const response = await fetch("/api/auth/sso/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: { redirectUrl: string };
        error?: string;
      };

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error ?? "Failed to generate portal access token");
      }

      // Redirect to portal with SSO token
      window.location.href = data.data.redirectUrl;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to access portal. Please try again.";
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalAccess}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-900 hover:bg-gray-50"
      variant="outline"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Opening Portal...
        </>
      ) : (
        <>
          <ExternalLink className="h-5 w-5" />
          Open Coach Portal
        </>
      )}
    </Button>
  );
}
