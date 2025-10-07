# Firebase Environment Variables Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter your project name (e.g., "globe-pixels")
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Enable Required Services

### Enable Firestore Database:
1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location for your database
5. Click **"Done"**

### Enable Firebase Storage:
1. In your Firebase project, click **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"** (for development)
4. Select the same location as your Firestore database
5. Click **"Done"**

## Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **Web icon** `</>` to add a web app
5. Enter an app nickname (e.g., "Globe Pixels Web App")
6. Click **"Register app"**
7. **Copy the configuration object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## Step 4: Create Your .env File

1. In your project root directory (`C:\Users\SSASOFT\globe-pixels`), create a file called `.env`
2. Add the following content, replacing the values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

## Step 5: Set Up Security Rules

### Firestore Rules:
1. In Firebase Console, go to **"Firestore Database"**
2. Click the **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dots/{document} {
      allow read, write: if true;
    }
    match /manifest/{document} {
      allow read, write: if true;
    }
  }
}
```
4. Click **"Publish"**

### Storage Rules:
1. In Firebase Console, go to **"Storage"**
2. Click the **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dots/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```
4. Click **"Publish"**

## Step 6: Test Your Setup

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and try uploading an image to a dot on the globe
3. Check Firebase Console to verify:
   - Images appear in **Storage** under the `dots/` folder
   - Metadata appears in **Firestore** under the `dots` collection
   - Manifest appears in **Firestore** under the `manifest` collection

## Troubleshooting

### If you get "Missing Firebase env vars" error:
- Make sure your `.env` file is in the project root directory
- Restart your development server after adding environment variables
- Check that all environment variable names start with `VITE_`

### If uploads fail:
- Check that Firestore and Storage are enabled in your Firebase project
- Verify that the security rules are published
- Make sure you're using the correct Firebase configuration

### If images don't load:
- Check the browser console for error messages
- Verify that images exist in Firebase Storage
- Check that the manifest is being created in Firestore
