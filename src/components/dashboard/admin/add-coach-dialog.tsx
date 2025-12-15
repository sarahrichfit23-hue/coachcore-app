"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Loader2 } from "lucide-react";
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
import { adminCoachesQueryKey, adminStatsQueryKey } from "@/lib/query-keys";

interface CreateCoachResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function AddCoachDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetState = () => {
    setName("");
    setEmail("");
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const createCoachMutation = useMutation({
    mutationFn: async (variables: { name: string; email: string }) => {
      const response = await fetch("/api/admin/create-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: variables.name,
          email: variables.email,
        }),
      });

      const data = (await response.json()) as CreateCoachResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to create coach");
      }

      return data.message ?? "Credentials emailed successfully";
    },
    onSuccess: () => {
      setFormError(null);
      setSuccessMessage("The login credentials have been emailed to the user.");
      toast.success("Credentials emailed successfully");
      void queryClient.invalidateQueries({ queryKey: adminCoachesQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminStatsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create coach";
      setFormError(message);
      toast.error(message);
    },
  });

  const handleCreateCoach = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    await createCoachMutation.mutateAsync({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2 bg-[#fcca56] text-gray-900 hover:bg-[#e8b94d]">
          <PlusCircle className="h-4 w-4" />
          Create Coach
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white">
        {successMessage ? (
          <>
            <DialogHeader>
              <DialogTitle>Coach created</DialogTitle>
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
              <DialogTitle>Create Coach</DialogTitle>
              <DialogDescription>
                Invite a coach with their name and email. Credentials will be
                generated and emailed automatically.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleCreateCoach}>
              <div className="space-y-2">
                <Label htmlFor="coach-name">Name</Label>
                <Input
                  id="coach-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Coach name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coach-email">Email</Label>
                <Input
                  id="coach-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="coach@email.com"
                  required
                />
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
                  disabled={createCoachMutation.isPending}
                >
                  {createCoachMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Coach"
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
