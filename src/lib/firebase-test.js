// Simple Firebase connection test
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log('🔍 Testing Firebase connection...');
  
  // Check environment variables
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
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ All environment variables are set');
  
  try {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    console.log('🔧 Initializing Firebase with config:', {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...'
    });
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase app initialized');
    console.log('✅ Firestore instance created');
    
    // Test Firestore connection by creating a test document
    const testDocRef = doc(db, 'test', 'connection-test');
    await setDoc(testDocRef, {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Test document created successfully');
    
    // Try to read it back
    const testDoc = await getDoc(testDocRef);
    if (testDoc.exists()) {
      console.log('✅ Test document read successfully:', testDoc.data());
    }
    
    console.log('🎉 Firebase connection test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}
