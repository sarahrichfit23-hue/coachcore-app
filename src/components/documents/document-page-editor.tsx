"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReactPageEditor } from "@/components/documents/react-page-editor";
import { type DocumentContent } from "@/types";

interface DocumentPageEditorProps {
  clientId: string;
  pageId: string;
  title: string;
  sectionName: string;
  initialJson: DocumentContent;
}

export function DocumentPageEditor({
  clientId,
  pageId,
  title,
  sectionName,
  initialJson,
}: DocumentPageEditorProps) {
  const [value, setValue] = useState<DocumentContent>(initialJson ?? {});

  const saveMutation = useMutation({
    mutationFn: async (json: DocumentContent) => {
      const response = await fetch(`/api/coach/client-document/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pageId, json }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to save page");
      }

      return json;
    },
    onSuccess: () => {
      toast.success("Page saved");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Save failed");
    },
  });
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">Section: {sectionName}</p>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>
        <Button
          onClick={() => saveMutation.mutate(value)}
          disabled={saveMutation.isPending}
          className="bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="min-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        <ReactPageEditor value={value} onChange={setValue} />
      </div>
    </div>
  );
}
