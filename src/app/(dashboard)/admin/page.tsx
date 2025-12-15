"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddCoachDialog } from "@/components/dashboard/admin/add-coach-dialog";
import { adminCoachesQueryKey, adminStatsQueryKey } from "@/lib/query-keys";

type AdminClient = {
  id: string;
  userId: string;
  name: string;
  email: string;
};

type AdminCoach = {
  id: string; // coach userId
  name: string;
  email: string;
  totalClients: number;
  clients: AdminClient[];
};

type AdminStatKey = "totalCoaches" | "totalClients" | "totalAdmins";

type AdminStat = {
  key: AdminStatKey;
  title: string;
  value: number;
  description: string;
};

const statIconMap: Record<AdminStatKey, typeof Users> = {
  totalCoaches: Users,
  totalClients: UserCheck,
  totalAdmins: ShieldCheck,
};

const statAccentMap: Record<AdminStatKey, string> = {
  totalCoaches: "border-l-4 border-l-orange-400",
  totalClients: "border-l-4 border-l-green-400",
  totalAdmins: "border-l-4 border-l-blue-400",
};

async function fetchCoaches(): Promise<AdminCoach[]> {
  const response = await fetch("/api/admin/coaches", {
    credentials: "include",
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: AdminCoach[];
    error?: string;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load coaches");
  }

  return payload.data;
}

async function fetchStats(): Promise<AdminStat[]> {
  const response = await fetch("/api/admin/stats", { credentials: "include" });

  const payload = (await response.json()) as {
    success: boolean;
    data?: AdminStat[];
    error?: string;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load stats");
  }

  return payload.data;
}

async function deleteCoach(coachId: string): Promise<void> {
  const response = await fetch("/api/admin/delete-coach", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coachId }),
  });

  const payload = (await response.json()) as {
    success: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Unable to delete coach");
  }
}

async function deleteClient(clientId: string): Promise<void> {
  const response = await fetch("/api/admin/delete-client", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });

  const payload = (await response.json()) as {
    success: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Unable to delete client");
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [coachDeleteTarget, setCoachDeleteTarget] = useState<AdminCoach | null>(
    null,
  );
  const [clientDeleteTarget, setClientDeleteTarget] =
    useState<AdminClient | null>(null);

  const {
    data: coaches = [],
    isLoading: coachesLoading,
    isError: coachesError,
  } = useQuery({
    queryKey: adminCoachesQueryKey,
    queryFn: fetchCoaches,
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: adminStatsQueryKey,
    queryFn: fetchStats,
    retry: 1,
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (coachId: string) => deleteCoach(coachId),
    onSuccess: () => {
      toast.success("Coach deleted successfully");
      setCoachDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: adminCoachesQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminStatsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete coach";
      toast.error(message);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      toast.success("Client deleted successfully");
      setClientDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: adminCoachesQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminStatsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete client";
      toast.error(message);
    },
  });

  const statsCards = useMemo(() => {
    if (statsQuery.isLoading || statsQuery.isError || !statsQuery.data) {
      return Array.from({ length: 3 }, (_, index) => ({
        key: `placeholder-${index}` as const,
        title: "Loading",
        value: 0,
        description: "Loading stats",
        icon: Users,
        color: "border-l-4 border-l-gray-200",
        isPlaceholder: true,
      }));
    }

    return statsQuery.data.map((stat) => ({
      ...stat,
      icon: statIconMap[stat.key],
      color: statAccentMap[stat.key],
      isPlaceholder: false,
    }));
  }, [statsQuery.data, statsQuery.isError, statsQuery.isLoading]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#b67b11]">
            Admin Dashboard
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Control Center</h1>
          <p className="text-sm text-gray-600">
            Monitor coaches, clients, and keep communications flowing.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${stat.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  {stat.isPlaceholder ? (
                    <div className="mt-3 h-7 w-20 rounded bg-gray-200" />
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {stat.description}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Coaches</h2>
            <p className="text-sm text-gray-600">
              Manage coaches, review their clients, and handle quick actions.
            </p>
          </div>
          <AddCoachDialog />
        </div>

        {coachesError ? (
          <Card className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Unable to load coaches. Please try again.</span>
          </Card>
        ) : coachesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <Card
                key={idx}
                className="h-48 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="h-full animate-pulse space-y-4">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-10 w-full rounded bg-gray-200" />
                    <div className="h-10 w-full rounded bg-gray-200" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
            No coaches yet. Use the Create Coach flow to add your first coach.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <Card
                key={coach.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {coach.name}
                    </h3>
                    <p className="text-sm text-gray-600">{coach.email}</p>
                    <p className="text-xs font-medium text-gray-500">
                      {coach.totalClients} client
                      {coach.totalClients === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/messages?contactId=${coach.id}`)
                      }
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCoachDeleteTarget(coach)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Delete ${coach.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">Clients</p>
                  {coach.clients.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No clients assigned.
                    </p>
                  ) : (
                    <ScrollArea className="max-h-64 overflow-y-auto pr-1">
                      <div className="space-y-2">
                        {coach.clients.map((client) => (
                          <div
                            key={client.id}
                            className="flex items-start justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {client.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {client.email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setClientDeleteTarget(client)}
                              className="text-gray-500 hover:text-red-600"
                              aria-label={`Delete ${client.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!coachDeleteTarget}
        onOpenChange={() => setCoachDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete coach?</DialogTitle>
            <DialogDescription>
              This will remove the coach, their profile, and all of their
              clients. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCoachDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                coachDeleteTarget &&
                deleteCoachMutation.mutate(coachDeleteTarget.id)
              }
              disabled={deleteCoachMutation.isPending}
              className="gap-2"
            >
              {deleteCoachMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!clientDeleteTarget}
        onOpenChange={() => setClientDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete client?</DialogTitle>
            <DialogDescription>
              This will remove the client and their profile. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setClientDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                clientDeleteTarget &&
                deleteClientMutation.mutate(clientDeleteTarget.id)
              }
              disabled={deleteClientMutation.isPending}
              className="gap-2"
            >
              {deleteClientMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
