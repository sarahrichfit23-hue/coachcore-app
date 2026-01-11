"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { coachClientsQueryKey } from "@/lib/query-keys";
import { type PortalTemplate } from "@/types";

interface Client {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  status?: string;
  hasPortal: boolean;
  createdAt?: string;
}

interface CreateClientResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function AddClientDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [progressPhases, setProgressPhases] = useState(3);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: templates = [] } = useQuery<PortalTemplate[]>({
    queryKey: ["portal-templates"],
    queryFn: async () => {
      const response = await fetch("/api/coach/portal-templates", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = (await response.json()) as {
        success: boolean;
        data?: PortalTemplate[];
      };
      return data.data || [];
    },
    enabled: open,
  });

  const resetState = () => {
    setName("");
    setEmail("");
    setProgressPhases(3);
    setTemplateId(undefined);
    setFormError("");
    setSuccessMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const createClientMutation = useMutation({
    mutationFn: async (variables: {
      name: string;
      email: string;
      progressPhases: number;
      templateId?: string;
    }) => {
      const response = await fetch("/api/coach/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: variables.name,
          email: variables.email,
          progressPhases: variables.progressPhases,
          templateId: variables.templateId,
        }),
      });

      const data = (await response.json()) as CreateClientResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to create client");
      }

      return data.message ?? "Credentials emailed successfully";
    },
    onSuccess: (_, variables) => {
      setFormError("");
      setSuccessMessage("The login credentials have been emailed to the user.");
      queryClient.setQueryData<Client[]>(coachClientsQueryKey, (previous) => {
        const nextClients = previous ?? [];
        return [
          ...nextClients,
          {
            id: `temp-${Date.now()}`,
            userId: "",
            name: variables.name,
            email: variables.email,
            status: "Active",
            hasPortal: false,
            createdAt: new Date().toISOString(),
          },
        ];
      });
      void queryClient.invalidateQueries({ queryKey: coachClientsQueryKey });
      toast.success("Credentials emailed successfully");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create client. Please try again.";
      setFormError(message);
      toast.error(message);
    },
  });

  const handleCreateClient = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");
    await createClientMutation.mutateAsync({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      progressPhases,
      templateId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 rounded-lg bg-[#fcca56] px-6 py-2.5 font-medium text-gray-900 hover:bg-[#fbc041]">
          <Plus className="h-5 w-5" />
          Add Client
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white" aria-label="Add a new client">
        {successMessage ? (
          <>
            <DialogHeader>
              <DialogTitle>Client created</DialogTitle>
              <DialogDescription>
                The login credentials have been emailed to the user.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="w-full justify-center bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
              >
                OK
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
              <DialogDescription>
                Invite a client with their name and email. We&apos;ll generate
                credentials and email them automatically.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleCreateClient}>
              <div className="space-y-2">
                <Label htmlFor="client-name">Name</Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="client@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress-phases">Progress phases</Label>
                <Input
                  id="progress-phases"
                  type="number"
                  min={1}
                  max={20}
                  value={progressPhases}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (Number.isNaN(nextValue)) {
                      setProgressPhases(1);
                      return;
                    }
                    const clamped = Math.min(
                      20,
                      Math.max(1, Math.floor(nextValue)),
                    );
                    setProgressPhases(clamped);
                  }}
                  placeholder="e.g. 6 phases"
                  required
                />
                <p className="text-xs text-gray-500">
                  How many phases should be created for this client (1-20)?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal-template">
                  Portal template (optional)
                </Label>
                <Select
                  value={templateId || ""}
                  onValueChange={(val) => setTemplateId(val || undefined)}
                >
                  <SelectTrigger id="portal-template">
                    <SelectValue placeholder="Use default template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose a saved template or use the default portal structure.
                </p>
              </div>

              {formError ? (
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
              ) : null}

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full justify-center bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Client"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
