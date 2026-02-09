# Coach Core

## 🚨 LOGIN ISSUE? READ THIS FIRST 🚨

**If you cannot log in or see "Database connection error":**

```bash
# Quick Fix (30 seconds):
cp .env.bak .env
npm install
npm run dev
```

**Detailed Help:**

- **Quick Reference:** [QUICK_FIX.md](./QUICK_FIX.md) ⭐ Start here!
- **Complete Guide:** [docs/LOGIN_FIX.md](./docs/LOGIN_FIX.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Automated Setup:** Run `bash scripts/setup.sh`

---

## Project Overview

This project is a web-based platform designed to streamline the relationship between coaches and their clients, focusing on personalized fitness or coaching programs. The core functionality revolves around coaches creating customizable document templates (e.g., introduction, onboarding, and workout planners) using a drag-and-drop builder. Coaches can onboard clients by inputting personal details and tailoring these templates, including creating multi-phase workout plans with drag-and-drop interfaces. Once onboarded, clients receive access to view their personalized documents, track progress through photo uploads and checkboxes, and communicate with the coach. The system includes a coach dashboard for managing multiple clients, viewing progress, and handling messages. An admin role is included for system oversight, such as managing users, resolving inquiries, and monitoring platform health.

The platform is built as a Minimum Viable Product (MVP) with investor-ready polish, emphasizing rapid development (≤2 weeks) without over-engineering for edge cases. It supports multi-tenancy with secure data isolation between coaches and clients. Key emphases include user-friendly interfaces and secure file uploads for progress tracking. Email notifications are delivered via Resend.

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
- **Email**: Resend (transactional emails) with SMTP fallback
- **Deployment**: Vercel (for frontend and API) + Hosted PostgreSQL (Supabase recommended)

- bcrypt
- dayjs
- sonner

## Main Features

- **Coach Profile Template Creation**: Drag-and-drop builder (via React-Page) to create multi-page templates with fixed sections (Onboarding, Program, Offboarding) and initial editable pages (e.g., Start Here, Coaching Agreement under Onboarding). Supports images, videos, lists, and custom layouts (e.g., flex/grid for phase components).
- **Client Onboarding**: Input client details (e.g., name, email), duplicate and personalize templates via a stepper, edit each page/section (e.g., add client info to Intake Questionnaire, personalize Fitness & Nutrition Program), define number of phases for progress tracking (e.g., 3 phases for photo uploads).
- **Personalized Document Viewing**: Clients view read-only versions of their customized documents and plans.
- **Progress Tracking**: Clients upload 3 physique photos per phase (based on coach-defined phases) and check off completions; coaches view progress on dashboards.
- **Notifications**: Email notifications via Resend; in-app chat is not used.
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

---

## Setup Instructions

### Automated Setup (Recommended)

Run the setup script to automatically restore your environment:

```bash
bash scripts/setup.sh
```

This script will:

- Restore the `.env` file from backup
- Install dependencies
- Verify environment configuration
- Report any issues

### Manual Setup

If you prefer manual setup or the automated script fails:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your PostgreSQL database (Supabase recommended)
4. Configure Cloudflare R2 storage (see below)
5. Create a `.env` file and add your environment variables (see Required Environment Variables below)
6. **Verify environment setup**: `npm run check-env` (recommended to catch config issues early)
7. **Deploy database schema**: `npm run prisma:push` (see [Prisma Deployment Guide](./docs/PRISMA_DEPLOYMENT_GUIDE.md))
8. Seed the database: `npm run seed`
9. Start the development server: `npm run dev`

### Required Environment Variables

Add these in a local `.env` and in Vercel project settings:

- **Auth**
  - `JWT_SECRET`: Random string used to sign session JWTs

- **Database (Supabase/Postgres)**
  - `DATABASE_URL`: Postgres connection string (include `?sslmode=require` when needed)

- **Email (Resend preferred)**
  - `RESEND_API_KEY`: Resend API key
  - `EMAIL_FROM`: Verified sender (e.g., `noreply@yourdomain.com`)
  - `PLATFORM_NAME`: Display name used in templates

- **Email (SMTP fallback)**
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP server details

- **Cloudflare R2**
  - `R2_PUBLIC_URL`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

### Database Setup

For detailed instructions on deploying your Prisma schema to Supabase:

- **Quick Start**: [docs/PRISMA_QUICK_START.md](./docs/PRISMA_QUICK_START.md) - TL;DR version
- **Complete Guide**: [docs/PRISMA_DEPLOYMENT_GUIDE.md](./docs/PRISMA_DEPLOYMENT_GUIDE.md) - Full documentation

### Cloudflare R2 Configuration

**Important:** To fix the "Failed to load resource: You do not have permission to access the requested resource" error, you must properly configure Cloudflare R2 storage.

See the detailed setup guide: **[docs/R2_SETUP.md](./docs/R2_SETUP.md)**

Key requirements:

- Enable public access on your R2 bucket
- Configure CORS to allow your application domain
- Set up API tokens with read/write permissions
- Configure environment variables correctly

### Cloudflare R2 CORS Configuration

To allow the application to load images from Cloudflare R2, you need to configure CORS on your R2 bucket:

1. Log in to your Cloudflare dashboard
2. Navigate to R2 → Your Bucket → Settings
3. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Important Notes:**

- Replace `https://your-production-domain.com` with your actual production URL
- For development, include `http://localhost:3000`
- For Vercel deployments, also add your Vercel preview URLs (e.g., `https://*.vercel.app`)

### R2 Bucket Public Access

Ensure your R2 bucket has a public domain configured:

1. In Cloudflare R2 dashboard, go to your bucket settings
2. Under "Public Access", enable "Allow Access" or configure a custom domain
3. Copy the public URL and set it as `R2_PUBLIC_URL` in your `.env` file

Example:

```
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

## Troubleshooting

If you encounter issues with database connections, authentication, or environment setup, see the **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** for detailed solutions.

### Quick Fixes

**Cannot login / Database connection error:**

```bash
# Restore .env file
cp .env.bak .env  # or cp .env.example .env

# Verify environment
npm run check-env

# Reinstall dependencies
npm install

# Start the app
npm run dev
```

See the [complete troubleshooting guide](./docs/TROUBLESHOOTING.md) for more details.

### Database Connection Error

If you encounter the error **"Database connection error. Please try again."** when trying to log in:

**Cause**: The `.env` file is missing or not properly configured.

**Solution**:

1. Check if the `.env` file exists in the project root:

   ```bash
   ls -la .env
   ```

2. If missing, create it from the backup or example:

   ```bash
   # If you have a backup:
   cp .env.bak .env

   # Or create from the example:
   cp .env.example .env
   ```

3. Edit the `.env` file and ensure these critical variables are set:

   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   JWT_SECRET=your_secret_here
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   ```

4. Run the environment checker to verify everything is configured correctly:
   ```bash
   npm run check-env
   ```
5. The Prisma client should automatically regenerate when you install dependencies:

   ```bash
   npm install
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

**Note**: The `.env` file is intentionally excluded from version control (via `.gitignore`) for security. Each developer or deployment environment needs their own `.env` file.
