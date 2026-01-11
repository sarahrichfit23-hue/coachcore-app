export type Role = "ADMIN" | "COACH" | "CLIENT";

// Permission scopes for role-based authorization
export type Scope =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "coaches:read"
  | "coaches:write"
  | "clients:read"
  | "clients:write"
  | "clients:manage"
  | "documents:read"
  | "documents:write"
  | "progress:read"
  | "progress:write"
  | "messages:read"
  | "messages:write"
  | "admin:access";

export interface RolePermission {
  id: string;
  role: Role;
  scopes: Scope[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isPasswordChanged: boolean;
  isActive: boolean;
  token: string | null;
  tokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachProfile {
  id: string;
  userId: string;
  template: DocumentTemplate | null;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProfile {
  id: string;
  userId: string;
  coachId: string;
  document: DocumentTemplate | null;
  totalPhases: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Progress {
  id: string;
  clientProfileId: string;
  phaseNumber: number;
  photo1Url: string | null;
  photo2Url: string | null;
  photo3Url: string | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
}

// Document Template Types
export interface DocumentTemplate {
  sections: DocumentSection[];
}

export interface DocumentSection {
  id: string;
  name: "Onboarding" | "Program" | "Offboarding";
  pages: DocumentPage[];
}

export interface DocumentPage {
  id: string;
  title: string;
  hidden: boolean;
  json: DocumentContent;
}

export type DocumentContent = Record<string, unknown>;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Session Types (for future auth implementation)
export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
  isPasswordChanged: boolean;
  avatarUrl?: string;
}

// Portal Template Types
export interface PortalTemplate {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalTemplateWithDocument extends PortalTemplate {
  document: DocumentTemplate;
}
