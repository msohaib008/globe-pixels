import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, getDocs, addDoc } from 'firebase/firestore';

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
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Collections
const DOTS_COLLECTION = 'dots';
const MANIFEST_COLLECTION = 'manifest';

export function dotStoragePath(dotId) {
  return `dots/${dotId}`;
}

export async function imageUrlForDot(dotId) {
  requireEnv();
  try {
    const storageRef = ref(storage, dotStoragePath(dotId));
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.warn(`Failed to get download URL for dot ${dotId}:`, error);
    return null;
  }
}

export async function uploadDotImage(dotId, file) {
  requireEnv();
  
  try {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, dotStoragePath(dotId));
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Store metadata in Firestore
    await setDoc(doc(db, DOTS_COLLECTION, dotId.toString()), {
      dotId: dotId,
      imageUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase upload failed:', error);
    throw new Error(`Firebase upload failed: ${error.message}`);
  }
}

export async function fetchManifest() {
  requireEnv();
  
  try {
    const manifestDoc = await getDocs(collection(db, MANIFEST_COLLECTION));
    
    if (manifestDoc.empty) {
      // Create initial manifest if none exists
      await setDoc(doc(db, MANIFEST_COLLECTION, 'dots'), { dots: [] });
      return { dots: [] };
    }
    
    // Get the first document (assuming there's only one manifest)
    const manifestData = manifestDoc.docs[0].data();
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
