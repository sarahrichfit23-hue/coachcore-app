import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// Validate R2 configuration on module load
function validateR2Config() {
  if (!process.env.R2_PUBLIC_URL) {
    console.error("R2_PUBLIC_URL is not configured in environment variables");
    return false;
  }
  if (!process.env.R2_ENDPOINT) {
    console.error("R2_ENDPOINT is not configured in environment variables");
    return false;
  }
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error("R2 credentials are not configured in environment variables");
    return false;
  }
  if (!process.env.R2_BUCKET_NAME) {
    console.error("R2_BUCKET_NAME is not configured in environment variables");
    return false;
  }
  return true;
}

// Check configuration on module load (but don't throw to allow app to start)
const isR2Configured = validateR2Config();

// Cloudflare R2 Client Configuration
// Use safe defaults if not configured to prevent initialization errors
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://placeholder.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "placeholder",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "placeholder",
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "placeholder";

// Upload file to R2
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  // Check if R2 is configured
  if (!isR2Configured) {
    throw new Error("R2 storage is not properly configured. Please check all R2 environment variables.");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Return the public URL (safe to use here as validated above)
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    
    // Provide specific error message based on error type
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to R2 storage: ${error.message}`);
    }
    
    throw new Error("Failed to upload file to storage. Please check R2 configuration and CORS settings.");
  }
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// Get file from R2 (for private access - requires @aws-sdk/s3-request-presigner for signed URLs)
export async function getFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return r2Client.send(command);
}

// Generate a unique file key
export function generateFileKey(
  userId: string,
  phaseNumber: number,
  photoIndex: number,
  extension: string,
): string {
  const timestamp = Date.now();
  return `progress/${userId}/phase-${phaseNumber}/photo-${photoIndex}-${timestamp}.${extension}`;
}
