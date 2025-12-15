"use client";

import DashboardShell, {
  type NavItem,
} from "@/app/(dashboard)/dashboard-shell";
import { CoachCoreLoader } from "@/components/ui/loader";
import { type AppRole } from "@/lib/auth/token";
import { useSession } from "@/providers";

function getDashboardHref(role?: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COACH":
      return "/coach";
    case "CLIENT":
      return "/client";
    default:
      return "/";
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();

  if (loading) {
    return <CoachCoreLoader />;
  }

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: getDashboardHref(user?.role as AppRole),
      iconKey: "dashboard",
    },
    { name: "Messages", href: "/messages", iconKey: "messages" },
    { name: "Settings", href: "/settings", iconKey: "settings" },
  ];

  // Convert User to Session format
  const userSession = user
    ? {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPasswordChanged: user.isPasswordChanged,
        avatarUrl: user.avatarUrl,
      }
    : null;

  return (
    <DashboardShell userInfo={userSession} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
