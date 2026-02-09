# Cloudflare R2 Storage Setup Guide

This guide will help you configure Cloudflare R2 storage for the Coach Core application to fix the "Failed to load resource: You do not have permission to access the requested resource" error.

## Prerequisites

- A Cloudflare account
- Access to Cloudflare R2 service

## Step 1: Create an R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage** in the left sidebar
3. Click **Create bucket**
4. Choose a unique bucket name (e.g., `coachcore-uploads`)
5. Select a location (if prompted)
6. Click **Create bucket**

## Step 2: Enable Public Access

For the application to load images, you need to enable public access to your R2 bucket:

### Option A: Use Cloudflare's Public Domain (Recommended for MVP)

1. In your bucket settings, go to **Settings** tab
2. Under **Public Access**, click **Allow Access**
3. Click **Connect Domain** to set up public access
4. Cloudflare will provide a public URL like: `https://pub-xxxxxxxxxxxxx.r2.dev`
5. Copy this URL - you'll need it for `R2_PUBLIC_URL` in your `.env` file

### Option B: Use Custom Domain (Production)

1. In your bucket settings, go to **Settings** tab
2. Under **Custom Domains**, click **Connect Domain**
3. Enter your custom domain (e.g., `cdn.yourdomain.com`)
4. Follow Cloudflare's instructions to add DNS records
5. Use this custom domain for `R2_PUBLIC_URL`

## Step 3: Configure CORS

CORS (Cross-Origin Resource Sharing) must be configured to allow your web application to load images from R2:

1. In your bucket, go to **Settings** tab
2. Scroll down to **CORS Policy**
3. Click **Add CORS policy** or **Edit** if one exists
4. Add the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Important:** Replace `https://your-production-domain.com` with your actual production URL.

5. Click **Save**

## Step 4: Create API Tokens

You need API tokens to allow your application to upload files to R2:

1. In the Cloudflare dashboard, navigate to **R2** → **Overview**
2. Click **Manage R2 API Tokens**
3. Click **Create API Token**
4. Configure the token:
   - **Token name**: `coachcore-api-token`
   - **Permissions**: Select **Object Read & Write**
   - **Specify bucket (optional)**: Select your bucket for better security
5. Click **Create API Token**
6. Copy the following values (you won't be able to see them again):
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL** (e.g., `https://xxxxxxxxxxxxx.r2.cloudflarestorage.com`)

## Step 5: Configure Environment Variables

Update your `.env` file with the R2 configuration:

```env
# Cloudflare R2 Storage Configuration
R2_ENDPOINT=https://xxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=coachcore-uploads
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
# Optional: Only needed if using a custom domain (without https://)
R2_CUSTOM_DOMAIN=cdn.yourdomain.com
```

**Replace the placeholder values with your actual values from steps 2 and 4.**

**Note about R2_CUSTOM_DOMAIN:**

- Only set this if you're using a custom domain for your R2 bucket (Option B from Step 2)
- Use just the hostname without `https://` (e.g., `cdn.yourdomain.com`)
- This is used for Next.js image optimization security
- Leave it empty if using the default R2 public domain

## Step 6: Verify Configuration

1. Restart your development server:

   ```bash
   npm run dev
   ```

2. Test the upload functionality:
   - Log in as a client
   - Navigate to the progress tracking page
   - Try uploading a progress photo
   - Verify the image displays correctly

## Troubleshooting

### Images Still Won't Load

If you still see the "Failed to load resource" error after configuration:

1. **Check CORS Configuration**
   - Ensure your application domain is in the `AllowedOrigins` list
   - For local development, ensure `http://localhost:3000` is included
   - Clear your browser cache and try again

2. **Verify Public Access**
   - Test the R2 public URL directly in your browser
   - Navigate to: `https://your-r2-public-url/test.jpg`
   - If you get a 403 error, public access is not properly configured

3. **Check Environment Variables**
   - Ensure `R2_PUBLIC_URL` does NOT have a trailing slash
   - Verify all R2 credentials are correct
   - Restart the development server after changing `.env`

4. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check the Console tab for specific error messages
   - Check the Network tab to see the failed request details

5. **Verify Bucket Permissions**
   - Ensure the API token has read and write permissions
   - Check that the token is scoped to the correct bucket

### Upload Fails with Authentication Error

If uploads fail with authentication errors:

1. Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
2. Ensure the API token hasn't expired
3. Check that the token has write permissions for the bucket

### Images Upload but Don't Display

If images upload successfully but don't display:

1. This is usually a CORS issue - double-check step 3
2. Ensure `R2_PUBLIC_URL` is set correctly
3. Verify the public access is enabled on the bucket

## Production Deployment Notes

When deploying to production (e.g., Vercel):

1. **Add Environment Variables**
   - Add all R2 environment variables to your hosting provider
   - In Vercel: Settings → Environment Variables

2. **Update CORS Configuration**
   - Add your production domain to the CORS `AllowedOrigins`
   - Add preview domains if using Vercel (e.g., `https://*.vercel.app`)

3. **Use Custom Domain (Optional)**
   - For production, consider using a custom domain for R2
   - This provides better branding and control

4. **Monitor Storage Usage**
   - Cloudflare R2 charges for storage and operations
   - Monitor usage in the Cloudflare dashboard

## Security Best Practices

1. **Restrict API Token Permissions**
   - Only grant necessary permissions (Object Read & Write)
   - Scope tokens to specific buckets when possible

2. **Use Environment Variables**
   - Never commit R2 credentials to version control
   - Use `.env.local` for sensitive values

3. **CORS Configuration**
   - Only allow necessary origins
   - Remove `http://localhost:3000` from production CORS

4. **File Upload Validation**
   - The application already validates file types and sizes
   - Review and adjust limits in `/src/app/api/client/upload-progress-photo/route.ts`

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
