"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/providers";
import { useMutation } from "@tanstack/react-query";

// Upload avatar mutation
const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/user/upload-avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload avatar");
  }

  const data = await response.json();
  return data.url;
};

// Update user profile
const updateUserProfile = async (updates: {
  name?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; data: Record<string, unknown> }> => {
  const response = await fetch("/api/user/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
};

export default function SettingsPage() {
  const { user, refetch } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      // Refetch session to update context
      refetch?.();
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      // Immediately update the user profile with new avatar
      await updateMutation.mutateAsync({ avatarUrl: url });
      toast.success("Avatar updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload avatar. Please try again.",
      );
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateMutation.mutateAsync({
        name: fullName,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      {/* Profile Information Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Profile Information
          </h2>
          <p className="text-sm text-gray-600">
            Update your personal information
          </p>
        </div>

        {/* Avatar Section */}
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              variant="outline"
              className="mb-1 flex items-center gap-2 rounded-lg border-gray-300 bg-white font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploadingAvatar ? "Uploading..." : "Change Avatar"}
            </Button>
            <p className="text-xs text-gray-500">
              JPG, GIF or PNG. Max size 2MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-lg border-gray-300 bg-white"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              className="h-11 rounded-lg border-gray-300 bg-white"
              disabled
            />
            <p className="text-xs text-gray-500">
              Contact support to change your email address
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveChanges}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-[#fcca56] px-8 py-2.5 font-medium text-gray-900 hover:bg-[#fbc041] disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Account Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Account</h2>
          <p className="text-sm text-gray-600">Manage your account settings</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Account Status</p>
            <p className="text-sm text-gray-600">Your account is active</p>
          </div>
          <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
