"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  Users,
  Activity,
  MessageSquare,
  FilePenLine,
  Trash2,
  Eye,
  Loader2,
  Images,
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
import { AddClientDialog } from "@/components/dashboard/coach/add-client-dialog";
import {
  coachClientProgressKey,
  coachClientsQueryKey,
  coachStatsQueryKey,
} from "@/lib/query-keys";

type Client = {
  id: string;
  userId: string;
  name: string;
  email: string;
  status?: string;
  hasPortal: boolean;
  createdAt: string;
};

type CoachStat = {
  key:
    | "totalClients"
    | "activeClients"
    | "totalProgressEntries"
    | "unreadMessages";
  title: string;
  value: number;
  description: string;
};

type ProgressPhase = {
  id: string;
  phaseNumber: number;
  frontImage: string | null;
  sideImage: string | null;
  backImage: string | null;
  isCompleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ClientProgressResponse = {
  client: {
    id: string;
    userId: string;
    name: string;
    email: string;
  };
  totalPhases: number;
  phases: ProgressPhase[];
};

const statIconMap: Record<CoachStat["key"], typeof Users> = {
  totalClients: Users,
  activeClients: Activity,
  totalProgressEntries: Images,
  unreadMessages: MessageSquare,
};

const statAccentMap: Record<CoachStat["key"], string> = {
  totalClients: "border-l-4 border-l-orange-400",
  activeClients: "border-l-4 border-l-green-400",
  totalProgressEntries: "border-l-4 border-l-blue-400",
  unreadMessages: "border-l-4 border-l-purple-400",
};

async function fetchClients(): Promise<Client[]> {
  const response = await fetch("/api/coach/get-clients", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load clients");
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: Array<{
      id: string;
      userId?: string;
      name: string;
      email: string;
      status?: string;
      hasPortal?: boolean;
      createdAt: string;
    }>;
    error?: string;
  };

  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load clients");
  }

  return payload.data.map((client) => ({
    id: client.id,
    userId: client.userId ?? "",
    status: client.status,
    hasPortal: client.hasPortal ?? false,
    name: client.name,
    email: client.email,
    createdAt: client.createdAt,
  }));
}

async function fetchCoachStats(): Promise<CoachStat[]> {
  const response = await fetch("/api/coach/stats", {
    credentials: "include",
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: CoachStat[];
    error?: string;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load stats");
  }

  return payload.data;
}

async function fetchClientProgress(
  clientId: string
): Promise<ClientProgressResponse> {
  const response = await fetch(
    `/api/coach/client-progress?clientId=${clientId}`,
    {
      credentials: "include",
    }
  );

  const payload = (await response.json()) as {
    success: boolean;
    data?: ClientProgressResponse;
    error?: string;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unable to load progress");
  }

  return payload.data;
}

async function deleteClient(clientId: string): Promise<void> {
  const response = await fetch("/api/coach/delete-client", {
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

export default function CoachDashboardPage() {
  const router = useRouter();

  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [progressTarget, setProgressTarget] = useState<Client | null>(null);

  const {
    data: clients = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: coachClientsQueryKey,
    queryFn: fetchClients,
    retry: 1,
  });

  const statsQuery: UseQueryResult<CoachStat[]> = useQuery({
    queryKey: coachStatsQueryKey,
    queryFn: fetchCoachStats,
    retry: 1,
  });

  const progressQuery: UseQueryResult<ClientProgressResponse> = useQuery({
    queryKey: coachClientProgressKey(progressTarget?.id ?? "pending"),
    queryFn: () => fetchClientProgress(progressTarget!.id),
    enabled: !!progressTarget,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.setQueryData<Client[]>(coachClientsQueryKey, (previous) =>
        (previous ?? []).filter((client) => client.id !== clientId)
      );
      void queryClient.invalidateQueries({ queryKey: coachClientsQueryKey });
      void queryClient.invalidateQueries({ queryKey: coachStatsQueryKey });
      toast.success("Client deleted successfully");
      setDeleteTarget(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete client";
      toast.error(message);
    },
  });

  const renderProgressImage = (src: string | null, label: string) => (
    <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <Images className="h-5 w-5" />
          <span>No {label.toLowerCase()} photo</span>
        </div>
      )}
    </div>
  );

  const statsCards = useMemo(() => {
    if (statsQuery.isLoading || statsQuery.isError || !statsQuery.data) {
      return Array.from({ length: 3 }, (_, index) => ({
        key: `placeholder-${index}`,
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
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s an overview of your coaching practice.
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Your Clients Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Clients</h2>
            <p className="text-sm text-gray-600">
              Manage your coaching clients and their portals
            </p>
          </div>
          <AddClientDialog />
        </div>

        {/* Client Cards */}
        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load clients. Please try again.
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
                  <div className="flex gap-2">
                    <div className="h-10 w-full rounded bg-gray-200" />
                    <div className="h-10 w-full rounded bg-gray-200" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
            No clients yet. Add your first client to get started.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(client)}
                    className="h-9 w-9 text-gray-500 hover:text-red-600"
                    aria-label={`Delete ${client.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Client Info */}
                <div className="mb-4">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {client.name}
                    </h3>
                    {client.status && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {client.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{client.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() =>
                      client.userId
                        ? router.push(`/messages?contactId=${client.userId}`)
                        : router.push("/messages")
                    }
                    className="w-full justify-center gap-2 border border-gray-300 bg-white font-medium text-gray-900 hover:bg-gray-50"
                    variant="outline"
                    disabled={!client.userId}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Button
                    onClick={() => setProgressTarget(client)}
                    className="w-full justify-center gap-2 border border-gray-300 bg-white font-medium text-gray-900 hover:bg-gray-50"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4" />
                    View Progress
                  </Button>
                  <Button
                    onClick={() => router.push(`/coach/edit/${client.id}`)}
                    className="w-full justify-center gap-2 bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                  >
                    <FilePenLine className="h-4 w-4" />
                    Edit Document
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
            <DialogTitle>Delete client</DialogTitle>
            <DialogDescription>
              This action removes the client profile, progress photos, and all
              related messages. You can&apos;t undo this.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">{deleteTarget?.name}</p>
            <p>{deleteTarget?.email}</p>
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
                "Delete client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!progressTarget}
        onOpenChange={(open) => {
          if (!open) {
            setProgressTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {progressTarget
                ? `${progressTarget.name} – Progress`
                : "Client progress"}
            </DialogTitle>
            <DialogDescription>
              View the uploaded photos for each phase. Scroll to see all phases.
            </DialogDescription>
          </DialogHeader>

          {progressQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-3">Loading progress...</span>
            </div>
          ) : progressQuery.isError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Unable to load progress. Please try again.
            </div>
          ) : progressQuery.data ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                {progressQuery.data.phases.map((phase) => (
                  <div
                    key={phase.id}
                    className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#b67b11]">
                          Phase {phase.phaseNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Updated{" "}
                          {new Date(phase.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {phase.isCompleted ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Completed
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {renderProgressImage(phase.frontImage, "Front")}
                      {renderProgressImage(phase.sideImage, "Side")}
                      {renderProgressImage(phase.backImage, "Back")}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              No progress data available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
