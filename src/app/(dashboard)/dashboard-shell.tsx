"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "@/types";

export type NavIconKey = "dashboard" | "messages" | "settings";

const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  messages: MessageSquare,
  settings: Settings,
};

export interface NavItem {
  name: string;
  href: string;
  iconKey: NavIconKey;
}

interface DashboardShellProps {
  userInfo: Session | null;
  navItems: NavItem[];
  children: React.ReactNode;
}

export default function DashboardShell({
  userInfo,
  navItems,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to sign out");
      }

      return response;
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#2d2d2b] lg:p-1">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#2d2d2b] text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="border-b border-[#3a3a38] px-6 py-6">
            <Image
              src="/coach-core-logo-new.png"
              alt="Coach Core"
              width={100}
              height={100}
              className="h-26 w-auto invert"
              priority
            />
          </div>

          {/* User Profile Section */}
          <div className="border-b border-[#3a3a38] px-6 py-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userInfo?.avatarUrl || ""} alt="User" />
                <AvatarFallback className="font-bold text-black">
                  {userInfo?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {userInfo?.name}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {userInfo?.email}
                </p>
                <span className="mt-1 inline-block rounded-full bg-[#fcca56]/20 px-2 py-0.5 text-xs font-medium text-[#fcca56]">
                  {userInfo?.role === "CLIENT"
                    ? "Prospect"
                    : userInfo?.role
                      ? userInfo.role.charAt(0) +
                        userInfo.role.slice(1).toLowerCase()
                      : ""}{" "}
                  Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = ICONS[item.iconKey];
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#fcca56] text-gray-900 shadow-md"
                      : "text-gray-300 hover:bg-[#3a3a38] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-[#3a3a38] px-4 py-6">
            <button
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
              className="flex w-full items-center gap-3 rounded-md bg-[#3a3a38] px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut className="h-5 w-5" />
              {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Coach Portal</h1>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f5f0] p-6 lg:rounded-4xl lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
