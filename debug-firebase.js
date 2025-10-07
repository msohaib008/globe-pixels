// Debug script to check Firebase configuration
// Run this in your browser console to debug Firebase setup

console.log('=== Firebase Configuration Debug ===');

// Check if environment variables are loaded
const envVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('Environment Variables:');
envVars.forEach(varName => {
  const value = import.meta.env[varName];
  console.log(`${varName}: ${value ? '✓ Set' : '✗ Missing'}`);
  if (value) {
    console.log(`  Value: ${value.substring(0, 20)}...`);
  }
});

// Test Firebase initialization
try {
  const { initializeApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  console.log('\nFirebase Config:');
  console.log(JSON.stringify(firebaseConfig, null, 2));
  
  const app = initializeApp(firebaseConfig);
  console.log('✓ Firebase app initialized successfully');
  
  const db = getFirestore(app);
  console.log('✓ Firestore instance created');
  
} catch (error) {
  console.error('✗ Firebase initialization failed:', error);
}
