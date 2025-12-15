import nodemailer from "nodemailer";

export type EmailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  platformName: string;
};

export type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function parsePort(port: string | undefined): Result<number> {
  if (!port) return { success: false, error: "SMTP_PORT is not set" };
  const parsed = Number.parseInt(port, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return { success: false, error: "SMTP_PORT must be a valid number" };
  }
  return { success: true, data: parsed };
}

export function getEmailConfig(): Result<EmailConfig> {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    PLATFORM_NAME,
  } = process.env;

  if (!SMTP_HOST) return { success: false, error: "SMTP_HOST is not set" };
  if (!SMTP_USER) return { success: false, error: "SMTP_USER is not set" };
  if (!SMTP_PASS) return { success: false, error: "SMTP_PASS is not set" };
  if (!EMAIL_FROM) return { success: false, error: "EMAIL_FROM is not set" };
  if (!PLATFORM_NAME)
    return { success: false, error: "PLATFORM_NAME is not set" };

  const parsedPort = parsePort(SMTP_PORT);
  if (!parsedPort.success) return parsedPort;

  return {
    success: true,
    data: {
      host: SMTP_HOST,
      port: parsedPort.data,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: EMAIL_FROM,
      platformName: PLATFORM_NAME,
    },
  };
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  config?: EmailConfig;
};

export async function sendEmail({
  to,
  subject,
  html,
  config,
}: SendEmailParams): Promise<Result> {
  const resolvedConfig: Result<EmailConfig> = config
    ? { success: true, data: config }
    : getEmailConfig();
  if (!resolvedConfig.success) {
    return { success: false, error: resolvedConfig.error };
  }

  const { host, port, user, pass, from } = resolvedConfig.data;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({ from, to, subject, html });
    console.log(`Email sent to ${to} with subject "${subject}"`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to send email", error);
    return { success: false, error: "Failed to send email" };
  }
}
