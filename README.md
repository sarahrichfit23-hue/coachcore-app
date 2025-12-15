# Coach Core

## Project Overview

This project is a web-based platform designed to streamline the relationship between coaches and their clients, focusing on personalized fitness or coaching programs. The core functionality revolves around coaches creating customizable document templates (e.g., introduction, onboarding, and workout planners) using a drag-and-drop builder. Coaches can onboard clients by inputting personal details and tailoring these templates, including creating multi-phase workout plans with drag-and-drop interfaces. Once onboarded, clients receive access to view their personalized documents, track progress through photo uploads and checkboxes, and communicate with the coach. The system includes a coach dashboard for managing multiple clients, viewing progress, and handling messages. An admin role is included for system oversight, such as managing users, resolving inquiries, and monitoring platform health.

The platform is built as a Minimum Viable Product (MVP) with investor-ready polish, emphasizing rapid development (≤2 weeks) without over-engineering for edge cases. It supports multi-tenancy with secure data isolation between coaches and clients. Key emphases include user-friendly interfaces, polled messaging, and secure file uploads for progress tracking. Note: Email notifications are omitted for this MVP; client access can be handled manually (e.g., via shared credentials or direct invite links).

## Technology Stack

### Frontend

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Document Builder**: React-Page (for drag-and-drop page creation with custom cells, grids, images, videos, lists, and layouts like side-by-side text/lists in "Phase" blocks)
- **Drag & Drop (for Phases/Exercises)**: dnd-kit
- **State Management**: TanStack Query (for server data)

### Backend/API

- **Server**: Next.js API Routes (for custom logic)

### Database

- **Type**: PostgreSQL (relational SQL for structured data like coaches, clients, documents, phases, and messages)
- **Management Tool**: pgAdmin4
- **ORM/Data Access**: Prisma ORM

### Other Services

- **File Storage**: Cloudflare R2 (for physique photo uploads)
- **Messaging**: Polling (client-side periodic fetches for messages instead of real-time)
- **Deployment**: Vercel (for frontend and API) + Hosted PostgreSQL (e.g., managed via pgAdmin4)

- bcrypt
- dayjs
- sonner

## Main Features

- **Coach Profile Template Creation**: Drag-and-drop builder (via React-Page) to create multi-page templates with fixed sections (Onboarding, Program, Offboarding) and initial editable pages (e.g., Start Here, Coaching Agreement under Onboarding). Supports images, videos, lists, and custom layouts (e.g., flex/grid for phase components).
- **Client Onboarding**: Input client details (e.g., name, email), duplicate and personalize templates via a stepper, edit each page/section (e.g., add client info to Intake Questionnaire, personalize Fitness & Nutrition Program), define number of phases for progress tracking (e.g., 3 phases for photo uploads).
- **Personalized Document Viewing**: Clients view read-only versions of their customized documents and plans.
- **Progress Tracking**: Clients upload 3 physique photos per phase (based on coach-defined phases) and check off completions; coaches view progress on dashboards.
- **Messaging**: Chat between coach and client via polling; coaches can also message admins for support.
- **Coach Dashboard**: Overview of all clients with options to edit personalized documents, view progress trackers, and access messages.
- **Admin Oversight**: Basic admin panel for user management (e.g., onboarding coaches with name/email and generated password), inquiry resolution, and system monitoring.
- **Security**: Role-based access and secure file handling.

## Document Structure

The coach template — and each client’s personalized document — consists of **3 fixed sections**, each with predefined pages. Coaches can **edit all pages**, but cannot add/remove sections or page categories in this MVP.

### **1. Onboarding**

1. Start Here
2. Coaching Agreement
3. Payment & Billing
4. Intake Questionnaire
5. Your Fitness & Nutrition Program

### **2. Program**

1. Course Material
2. Course Notes
3. Resources

### **3. Offboarding**

1. Program Recap
2. Final Reflection
3. Feedback
4. Next Steps

All pages use the React-Page builder and support text, lists, images, videos, and custom layouts.

---

## User Flows

### Admin Flow

1. **Login**: Access the system with admin credentials.
2. **Coach Onboarding**: Add a new coach by inputting name and email; system generates a password.
3. **Notify Coach**: Manually inform the coach of their login credentials (email and generated password).
4. **Dashboard Access**: View an overview of all coaches and clients, including active users, recent activities, and system metrics.
5. **User Management**: Search and manage coaches/clients (e.g., approve new coaches, suspend accounts, reset passwords).
6. **Inquiry Handling**: Receive and respond to messages from coaches about system issues or inquiries via the messaging interface (polled updates).
7. **Monitoring**: Review logs or reports for platform health, such as storage usage.
8. **Logout**: Securely end the session.

### Coach Flow

1. **First Login**: Log in with provided email and system-generated password.
2. **Password Reset**: Immediately reset the generated password to a new one.
3. **Profile Setup**: Review and edit the document overview with 3 fixed sections (Onboarding, Program, Offboarding) and their initial editable pages: Onboarding (Start Here, Coaching Agreement, Payment & Billing, Intake Questionnaire, Your Fitness & Nutrition Program); Program (Course Material, Course Notes, Resources); Offboarding (Program Recap, Final Reflection, Feedback, Next Steps). Use React-Page to customize content.
4. **Complete Profile**: Confirm the document looks good and finalize the profile setup.
5. **Dashboard Access**: View dashboard with option to add clients.
6. **Add Client**: Click to add a client; use stepper: First step - input client name and email (system generates password); Second step - go through the document, edit/personalize each page/section (e.g., add client info to Intake Questionnaire, personalize Your Fitness & Nutrition Program), define number of phases for progress tracking (e.g., 3 phases).
7. **Finalize Client Onboarding**: Save the customized document; manually inform the client of their login credentials (email and generated password).
8. **Dashboard Management**: View list of clients; for each, edit their personalized document, view messages (via polling), and progress (photos and checkboxes per phase).
9. **Messaging**: Respond to client messages (polled updates); send inquiries to admin if needed.
10. **Logout**: End session securely.

### Client Flow

1. **First Login**: Receive manual invite (e.g., credentials shared by coach); log in with email and system-generated password.
2. **Password Setup**: Immediately set up a new password.
3. **Dashboard Access**: Go straight to the dashboard.
4. **Document Viewing**: View read-only personalized document with sections like Onboarding, Program, and Offboarding (including all customized pages).
5. **Progress Tracking**: See coach-defined phases; for each phase, upload 3 physique photos using Cloudflare R2 and check off completion.
6. **Messaging**: Send/receive messages to/from the coach (via polling).
7. **Logout**: End session securely.
