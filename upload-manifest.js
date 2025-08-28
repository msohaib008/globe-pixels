import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.VITE_CLOUDINARY_PRESET;
const FOLDER = process.env.VITE_CLOUDINARY_FOLDER || 'globe/dots';
const MANIFEST_ID = process.env.VITE_CLOUDINARY_MANIFEST_ID || 'dots-manifest/manifest';

// Initial empty manifest
const initialManifest = {
  dots: []
};

async function saveManifest(manifest) {
  if (!CLOUD_NAME || !PRESET) {
    throw new Error('Missing Cloudinary env: VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_PRESET');
  }
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const fd = new FormData();
  fd.append('file', blob);
  fd.append('upload_preset', PRESET);
  fd.append('public_id', MANIFEST_ID);
  fd.append('resource_type', 'raw');
  
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudinary manifest upload failed: ${res.status} ${errorText}`);
  }
  return true;
}

async function uploadInitialManifest() {
  try {
    console.log('Uploading initial manifest to Cloudinary...');
    console.log(`Cloud Name: ${CLOUD_NAME}`);
    console.log(`Upload Preset: ${PRESET}`);
    console.log(`Manifest ID: ${MANIFEST_ID}`);
    
    await saveManifest(initialManifest);
    console.log('✅ Manifest uploaded successfully!');
    console.log('Your manifest is now available at:');
    console.log(`https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${MANIFEST_ID}.json`);
  } catch (error) {
    console.error('❌ Failed to upload manifest:', error.message);
    console.log('\nMake sure you have these environment variables set in your .env file:');
    console.log('- VITE_CLOUDINARY_CLOUD_NAME');
    console.log('- VITE_CLOUDINARY_PRESET');
    console.log('- VITE_CLOUDINARY_FOLDER (optional, defaults to "globe/dots")');
  }
}

uploadInitialManifest();
