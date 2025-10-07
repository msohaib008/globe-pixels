import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { optimizeImageToSize, fileToBase64, logOptimizationResults } from './image-optimizer.js';

// Firebase configuration - these should be set in your environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function requireEnv() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
  }
}

// Initialize Firebase (Storage not needed)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const DOTS_COLLECTION = 'dots';
const MANIFEST_COLLECTION = 'manifest';

// Helper functions are now imported from image-optimizer.js

export async function uploadDotImage(dotId, file) {
  requireEnv();
  
  try {
    const originalSizeKB = Math.round(file.size / 1024);
    console.log(`📤 Uploading image for dot ${dotId}, original size: ${originalSizeKB}KB`);
    
    // Optimize image to target 500KB
    const optimizedFile = await optimizeImageToSize(file, 500);
    const optimizedSizeKB = Math.round(optimizedFile.size / 1024);
    
    // Log optimization results
    logOptimizationResults(file, optimizedFile);
    console.log(`📏 Optimized image: ${optimizedSizeKB}KB (target: 500KB)`);
    
    // Convert to base64
    const base64Data = await fileToBase64(optimizedFile);
    const base64SizeKB = Math.round(base64Data.length * 0.75 / 1024); // Approximate base64 size
    
    console.log(`📊 Final size after base64 encoding: ~${base64SizeKB}KB`);
    
    // Store in Firestore
    const dotData = {
      dotId: dotId,
      imageData: base64Data, // Base64 encoded image
      fileName: file.name,
      originalFileSize: file.size,
      optimizedFileSize: optimizedFile.size,
      base64Size: base64Data.length,
      fileType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, DOTS_COLLECTION, dotId.toString()), dotData);
    
    console.log(`✅ Image optimized and stored in Firestore for dot ${dotId}`);
    console.log(`📈 Size reduction: ${originalSizeKB}KB → ${optimizedSizeKB}KB (${Math.round((1 - optimizedFile.size/file.size) * 100)}% smaller)`);
    
    // Return the base64 data URL for immediate display
    return base64Data;
    
  } catch (error) {
    console.error('Firebase Firestore upload failed:', error);
    throw new Error(`Firestore upload failed: ${error.message}`);
  }
}

export async function fetchManifest() {
  requireEnv();
  
  try {
    const manifestDoc = await getDoc(doc(db, MANIFEST_COLLECTION, 'dots'));
    
    if (!manifestDoc.exists()) {
      // Create initial manifest if none exists
      await setDoc(doc(db, MANIFEST_COLLECTION, 'dots'), { dots: [] });
      return { dots: [] };
    }
    
    const manifestData = manifestDoc.data();
    return manifestData.dots ? manifestData : { dots: [] };
  } catch (error) {
    console.error('Failed to fetch manifest:', error);
    return { dots: [] };
  }
}

export async function saveManifest(manifest) {
  requireEnv();
  
  try {
    await setDoc(doc(db, MANIFEST_COLLECTION, 'dots'), manifest);
    return true;
  } catch (error) {
    console.error('Failed to save manifest:', error);
    throw new Error(`Failed to save manifest: ${error.message}`);
  }
}

export function addDotToManifest(manifest, dotId) {
  const m = manifest && Array.isArray(manifest.dots) ? manifest : { dots: [] };
  if (!m.dots.includes(dotId)) {
    m.dots.push(dotId);
  }
  return m;
}

export async function getAllDots() {
  requireEnv();
  
  try {
    const dotsSnapshot = await getDocs(collection(db, DOTS_COLLECTION));
    const dots = [];
    
    dotsSnapshot.forEach((doc) => {
      dots.push({ id: doc.id, ...doc.data() });
    });
    
    return dots;
  } catch (error) {
    console.error('Failed to fetch dots:', error);
    return [];
  }
}

// Function to get image data for a specific dot
export async function getDotImage(dotId) {
  requireEnv();
  
  try {
    const dotDoc = await getDoc(doc(db, DOTS_COLLECTION, dotId.toString()));
    
    if (dotDoc.exists()) {
      const data = dotDoc.data();
      return data.imageData; // Returns base64 data URL
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get image for dot ${dotId}:`, error);
    return null;
  }
}

// Function to get image URL for compatibility with existing code
export async function imageUrlForDot(dotId) {
  const imageData = await getDotImage(dotId);
  return imageData; // Returns base64 data URL directly
}
