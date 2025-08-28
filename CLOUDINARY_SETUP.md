# Cloudinary Setup Guide

## Environment Variables

Create a `.env` file in your project root with these variables:

```env
# Cloudinary Configuration
# Get these values from your Cloudinary dashboard
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_PRESET=your_upload_preset_here

# Optional: Custom folder for storing dot images
VITE_CLOUDINARY_FOLDER=globe/dots

# Optional: Custom manifest ID (defaults to "dots-manifest/manifest")
VITE_CLOUDINARY_MANIFEST_ID=dots-manifest/manifest
```

## Getting Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Sign up or log in
3. Copy your **Cloud Name** from the dashboard
4. Go to Settings → Upload → Upload presets
5. Create a new upload preset or use an existing one
6. Make sure the preset allows:
   - Image uploads
   - Raw file uploads (for the manifest JSON)
   - Public ID setting (optional but recommended)

## Upload Initial Manifest

After setting up your environment variables, run:

```bash
node upload-manifest.js
```

This will create an empty manifest file on Cloudinary that your app can use to track dots.

## Manifest Structure

The manifest is a JSON file with this structure:
```json
{
  "dots": [1, 2, 3, 4, 5]
}
```

Where the numbers represent dot IDs that have been placed on the globe.

## Troubleshooting

- **"Missing Cloudinary env"**: Make sure your `.env` file exists and has the correct variable names
- **Upload failed**: Check that your upload preset allows the file types you're trying to upload
- **Manifest not found**: Run the upload script to create the initial manifest
