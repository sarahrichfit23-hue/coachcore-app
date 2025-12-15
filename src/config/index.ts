// Application Configuration
export const config = {
  // App
  appName: "Coach Core",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,

  // File Upload
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  maxPhotosPerPhase: 3,

  // Polling
  messagePollingInterval: 5000, // 5 seconds

  // Password
  minPasswordLength: 8,
  generatedPasswordLength: 12,

  // Document Structure
  documentSections: [
    {
      name: "Onboarding" as const,
      pages: [
        "Start Here",
        "Coaching Agreement",
        "Payment & Billing",
        "Intake Questionnaire",
        "Your Fitness & Nutrition Program",
      ],
    },
    {
      name: "Program" as const,
      pages: ["Course Material", "Course Notes", "Resources"],
    },
    {
      name: "Offboarding" as const,
      pages: ["Program Recap", "Final Reflection", "Feedback", "Next Steps"],
    },
  ],
} as const;

export default config;
