import path from "node:path";
import { readFile } from "node:fs/promises";
import { Result } from "../sendEmail";

export type OnboardingTemplateParams = {
  clientName: string;
  clientEmail: string;
  tempPassword: string;
  setPasswordUrl: string;
  platformName: string;
  logoUrl?: string;
  supportUrl?: string;
};

const templatePath = path.join(
  process.cwd(),
  "src/lib/email/templates/onboarding.html",
);

let cachedTemplate: string | null = null;

async function loadTemplate(): Promise<Result<string>> {
  if (cachedTemplate) return { success: true, data: cachedTemplate };

  try {
    const file = await readFile(templatePath, "utf8");
    cachedTemplate = file;
    return { success: true, data: file };
  } catch (error) {
    console.error("Failed to load email template", error);
    return { success: false, error: "Unable to load email template" };
  }
}

function applyPlaceholders(
  template: string,
  placeholders: Record<string, string>,
): string {
  let html = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const pattern = new RegExp(`{{${key}}}`, "g");
    html = html.replace(pattern, value);
  }
  return html;
}

export async function renderOnboardingTemplate(
  params: OnboardingTemplateParams,
): Promise<Result<string>> {
  const template = await loadTemplate();
  if (!template.success) return template;

  const placeholders: Record<string, string> = {
    CLIENT_NAME: params.clientName,
    CLIENT_EMAIL: params.clientEmail,
    TEMP_PASSWORD: params.tempPassword,
    SET_PASSWORD_URL: params.setPasswordUrl,
    YEAR: String(new Date().getFullYear()),
    PLATFORM_NAME: params.platformName,
    LOGO_URL:
      params.logoUrl ??
      `${process.env.NEXT_PUBLIC_APP_URL}/coach-core-logo-new.png`,
    SUPPORT_URL: params.supportUrl ?? "#",
  };

  const html = applyPlaceholders(template.data, placeholders);
  return { success: true, data: html };
}
