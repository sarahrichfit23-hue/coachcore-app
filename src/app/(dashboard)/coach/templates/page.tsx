"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PortalTemplate } from "@/types";

async function fetchTemplates(): Promise<PortalTemplate[]> {
  const response = await fetch("/api/coach/portal-templates", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load templates");
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: PortalTemplate[];
    error?: string;
  };

  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load templates");
  }

  return payload.data;
}

async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/api/coach/portal-templates/${templateId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const payload = (await response.json()) as {
    success: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Unable to delete template");
  }
}

export default function PortalTemplatesPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const {
    data: templates = [],
    isLoading,
    isError,
  } = useQuery<PortalTemplate[]>({
    queryKey: ["portal-templates"],
    queryFn: fetchTemplates,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async (variables: { name: string; description: string }) => {
      const response = await fetch("/api/coach/portal-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: variables.name,
          description: variables.description,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: PortalTemplate;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to create template");
      }

      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal-templates"] });
      toast.success("Template created successfully");
      setCreateDialogOpen(false);
      setTemplateName("");
      setTemplateDescription("");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create template. Please try again.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal-templates"] });
      toast.success("Template deleted successfully");
      setDeleteTarget(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete template";
      toast.error(message);
    },
  });

  const handleCreateTemplate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      name: templateName.trim(),
      description: templateDescription.trim(),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Portal Templates
        </h1>
        <p className="text-gray-600">
          Create and manage reusable portal templates for your clients. Save
          time by creating templates once and reusing them when adding new
          clients.
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#fcca56] px-6 py-2.5 font-medium text-gray-900 hover:bg-[#fbc041]"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load templates. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, idx) => (
            <Card
              key={idx}
              className="h-40 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="h-full animate-pulse space-y-4">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="mb-2 text-gray-900">No templates yet</p>
          <p className="text-sm text-gray-600">
            Create your first portal template to reuse when adding new clients.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(template)}
                  className="h-9 w-9 text-gray-500 hover:text-red-600"
                  aria-label={`Delete ${template.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create Portal Template</DialogTitle>
            <DialogDescription>
              Create a new portal template based on the default structure. You
              can customize it later for specific clients.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateTemplate}>
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="e.g., Standard Coaching Portal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">
                Description (optional)
              </Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                placeholder="Brief description of this template"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Template"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone. Existing clients using this template will not be
              affected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">{deleteTarget?.name}</p>
            {deleteTarget?.description && <p>{deleteTarget.description}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
