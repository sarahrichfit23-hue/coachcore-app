"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type DocumentTemplate } from "@/types";

interface DocumentSectionListProps {
  clientId: string;
  document: DocumentTemplate;
}

export function DocumentSectionList({
  clientId,
  document,
}: DocumentSectionListProps) {
  const [localDoc, setLocalDoc] = useState<DocumentTemplate>(document);

  const toggleHidden = useMutation({
    mutationFn: async ({
      pageId,
      hidden,
    }: {
      pageId: string;
      hidden: boolean;
    }) => {
      const response = await fetch(`/api/coach/client-document/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pageId, hidden }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: { document: DocumentTemplate };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.document) {
        throw new Error(payload.error || "Unable to update page");
      }

      return payload.data.document;
    },
    onSuccess: (updated) => {
      setLocalDoc(updated);
      toast.success("Page visibility updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  return (
    <div className="space-y-4">
      {localDoc.sections.map((section) => (
        <details
          key={section.id}
          className="rounded-xl border border-gray-200 bg-white p-4"
          open
        >
          <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-gray-900">
            <span>{section.name}</span>
            <span className="text-sm font-normal text-gray-500">
              {section.pages.length} page{section.pages.length === 1 ? "" : "s"}
            </span>
          </summary>

          <div className="mt-3 space-y-2">
            {section.pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={toggleHidden.isPending}
                    onClick={() =>
                      toggleHidden.mutate({
                        pageId: page.id,
                        hidden: !page.hidden,
                      })
                    }
                    aria-label={page.hidden ? "Show page" : "Hide page"}
                    className={`flex size-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-[#fcca56] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      page.hidden
                        ? "border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                        : "border-[#fcca56] bg-white text-gray-900 hover:bg-[#fff6e0]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {page.hidden ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {page.hidden ? "Hidden from client" : "Visible to client"}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  className="bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                >
                  <Link href={`/coach/edit/${clientId}/${page.id}`}>Edit</Link>
                </Button>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
