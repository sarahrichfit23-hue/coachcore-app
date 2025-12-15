"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ImageOff,
  CheckCircle2,
  UploadCloud,
  Camera,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clientProgressQueryKey } from "@/lib/query-keys";

interface ProgressPhase {
  id: string;
  phaseNumber: number;
  frontImage: string | null;
  sideImage: string | null;
  backImage: string | null;
  isCompleted: boolean;
}

interface GetProgressResponse {
  success: boolean;
  data?: {
    totalPhases: number;
    phases: ProgressPhase[];
  };
  error?: string;
}

interface UploadResponse {
  success: boolean;
  data?: ProgressPhase & { view?: "front" | "side" | "back" };
  error?: string;
}

interface CompleteResponse {
  success: boolean;
  data?: ProgressPhase;
  error?: string;
}

async function fetchClientProgress(): Promise<{
  totalPhases: number;
  phases: ProgressPhase[];
}> {
  const response = await fetch("/api/client/get-progress", {
    credentials: "include",
  });

  const json = (await response.json()) as GetProgressResponse;

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error ?? "Unable to fetch progress");
  }

  return json.data;
}

async function uploadProgressPhoto(
  phaseId: string,
  view: "front" | "side" | "back",
  file: File
): Promise<ProgressPhase> {
  const formData = new FormData();
  formData.append("phaseId", phaseId);
  formData.append("view", view);
  formData.append("file", file);

  const response = await fetch("/api/client/upload-progress-photo", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const json = (await response.json()) as UploadResponse;

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error ?? "Upload failed");
  }

  return json.data;
}

async function completeProgress(phaseId: string): Promise<ProgressPhase> {
  const response = await fetch("/api/client/complete-progress", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phaseId }),
  });

  const json = (await response.json()) as CompleteResponse;

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error ?? "Unable to save progress");
  }

  return json.data;
}

function UploadBox({
  label,
  preview,
  onSelect,
  loading,
  disabled,
}: {
  label: string;
  preview: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (file: File) => void;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelect(file);
    event.target.value = "";
  };

  return (
    <label className="group flex h-[280px] w-full max-w-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center transition hover:border-[#f0b43c] hover:bg-[#fff8ec] disabled:cursor-not-allowed disabled:opacity-70">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={loading || disabled}
      />
      {preview ? (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900">
              Replace photo
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-700">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#f0b43c]" />
          ) : (
            <Camera className="h-6 w-6 text-[#f0b43c]" />
          )}
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-gray-500">PNG, JPG up to 5MB</div>
        </div>
      )}
    </label>
  );
}

export function ClientProgressTable() {
  const queryClient = useQueryClient();
  const [activeUploadKey, setActiveUploadKey] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [modalPhase, setModalPhase] = useState<ProgressPhase | null>(null);
  const [reflectionChecked, setReflectionChecked] = useState<
    Record<string, boolean>
  >({});

  const progressQuery = useQuery({
    queryKey: clientProgressQueryKey,
    queryFn: fetchClientProgress,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      phaseId,
      view,
      file,
    }: {
      phaseId: string;
      view: "front" | "side" | "back";
      file: File;
    }) => uploadProgressPhoto(phaseId, view, file),
    onSuccess: (updatedPhase) => {
      queryClient.setQueryData<{
        totalPhases: number;
        phases: ProgressPhase[];
      }>(clientProgressQueryKey, (previous) => {
        if (!previous) return previous;
        const nextPhases = previous.phases.map((phase) =>
          phase.id === updatedPhase.id ? updatedPhase : phase
        );
        return { ...previous, phases: nextPhases };
      });
      setActiveUploadKey(null);
      if (modalPhase && modalPhase.id === updatedPhase.id) {
        setModalPhase(updatedPhase);
      }
      toast.success("Photo uploaded");
    },
    onError: (error) => {
      setActiveUploadKey(null);
      toast.error(
        error instanceof Error ? error.message : "Unable to upload photo"
      );
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (phaseId: string) => completeProgress(phaseId),
    onSuccess: (updatedPhase) => {
      queryClient.setQueryData<{
        totalPhases: number;
        phases: ProgressPhase[];
      }>(clientProgressQueryKey, (previous) => {
        if (!previous) return previous;
        const nextPhases = previous.phases.map((phase) =>
          phase.id === updatedPhase.id ? updatedPhase : phase
        );
        return { ...previous, phases: nextPhases };
      });
      setModalPhase(null);
      toast.success("Progress saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to save progress"
      );
    },
  });

  const handleUpload = async (
    phaseId: string,
    view: "front" | "side" | "back",
    file: File
  ) => {
    const key = `${phaseId}-${view}`;
    setActiveUploadKey(key);
    setActivePhaseId(phaseId);
    await uploadMutation.mutateAsync({ phaseId, view, file });
  };

  const isUploading = (phaseId: string, view: "front" | "side" | "back") =>
    activeUploadKey === `${phaseId}-${view}` && uploadMutation.isPending;

  const openModalForPhase = (phase: ProgressPhase) => {
    setModalPhase(phase);
    setActivePhaseId(phase.id);
  };

  const handleReflectionToggle = (phaseId: string, checked: boolean) => {
    setReflectionChecked((prev) => ({ ...prev, [phaseId]: checked }));
    if (checked) {
      const phase = progressQuery.data?.phases.find((p) => p.id === phaseId);
      if (phase) {
        openModalForPhase(phase);
      }
    }
  };

  const renderPhases = () => {
    if (progressQuery.isLoading) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-6 text-sm text-gray-600 shadow">
          <Loader2 className="h-5 w-5 animate-spin text-[#f0b43c]" />
          Loading your progress phases...
        </div>
      );
    }

    if (progressQuery.isError || !progressQuery.data) {
      return (
        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
          <ImageOff className="h-5 w-5" />
          {(progressQuery.error as Error)?.message ?? "Unable to load progress"}
        </div>
      );
    }

    const { phases } = progressQuery.data;

    if (phases.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow">
          <p className="text-lg font-semibold text-gray-900">No phases yet</p>
          <p className="text-sm text-gray-600">
            Your coach has not configured your progress plan yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {phases.map((phase) => {
          const checked = reflectionChecked[phase.id] ?? phase.isCompleted;
          const allUploaded = !!(
            phase.frontImage &&
            phase.sideImage &&
            phase.backImage
          );
          const uploadsDisabled =
            uploadMutation.isPending && activePhaseId === phase.id;
          return (
            <div
              key={phase.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#b67b11]">
                    Phase {phase.phaseNumber}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reflection & photos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload front, side, and back views once this phase is ready.
                  </p>
                </div>
                {phase.isCompleted ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </span>
                ) : null}
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    handleReflectionToggle(phase.id, Boolean(value))
                  }
                  disabled={phase.isCompleted}
                />
                <span>Complete Phase {phase.phaseNumber} Reflection</span>
              </label>

              {checked ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-[#f7c355] bg-[#fff8ec] px-4 py-4 text-sm text-gray-800">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      Upload your progress photos
                    </p>
                    <p className="text-sm text-gray-700">
                      Front, side, and back views to help your coach assess
                      progress.
                    </p>
                  </div>
                  {phase.isCompleted ? (
                    <Button
                      variant="outline"
                      onClick={() => openModalForPhase(phase)}
                      className="border-gray-300 text-gray-900 hover:bg-gray-50"
                    >
                      View Photos
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openModalForPhase(phase)}
                      className="bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                    >
                      Upload Photos
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const modalContent = useMemo(() => {
    if (!modalPhase) return null;
    const { id, phaseNumber, frontImage, sideImage, backImage, isCompleted } =
      modalPhase;
    const allUploaded = !!(frontImage && sideImage && backImage);
    const disableUploads = uploadMutation.isPending && activePhaseId === id;
    return (
      <Dialog
        open={!!modalPhase}
        onOpenChange={(open) => !open && setModalPhase(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Phase {phaseNumber} photos</DialogTitle>
            <DialogDescription>
              Upload one image for each view. Once all are uploaded, save your
              progress.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap justify-center gap-4">
            <UploadBox
              label="Front view"
              preview={frontImage}
              loading={isUploading(id, "front")}
              disabled={disableUploads || isCompleted}
              onSelect={(file) => handleUpload(id, "front", file)}
            />
            <UploadBox
              label="Side view"
              preview={sideImage}
              loading={isUploading(id, "side")}
              disabled={disableUploads || isCompleted}
              onSelect={(file) => handleUpload(id, "side", file)}
            />
            <UploadBox
              label="Back view"
              preview={backImage}
              loading={isUploading(id, "back")}
              disabled={disableUploads || isCompleted}
              onSelect={(file) => handleUpload(id, "back", file)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#b67b11]" />
              <span>All three views are required to save.</span>
            </div>
            <Button
              disabled={
                !allUploaded || completeMutation.isPending || isCompleted
              }
              onClick={() => completeMutation.mutate(id)}
              className="bg-[#fcca56] text-gray-900 hover:bg-[#fbc041] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCompleted
                ? "Already saved"
                : completeMutation.isPending
                  ? "Saving..."
                  : "Save Progress"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [
    modalPhase,
    completeMutation.isPending,
    uploadMutation.isPending,
    activePhaseId,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Progress Tracker
          </h2>
          <p className="text-sm text-gray-600">
            Complete reflections and share photos each phase to keep your coach
            in sync.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#f0b43c] text-[#b67b11] hover:bg-[#fff4d6]"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: clientProgressQueryKey })
          }
          disabled={progressQuery.isFetching}
        >
          {progressQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {renderPhases()}

      {modalContent}
    </div>
  );
}
