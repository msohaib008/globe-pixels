# Globe Pixels

Interactive 3D globe where users can upload images to dots. Images are stored in Firebase Storage and metadata is saved in Firestore.

## Firebase Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firebase Storage and Firestore Database

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings > General
2. Scroll down to "Your apps" and click "Add app" > Web
3. Copy the Firebase configuration object

### 3. Environment Variables
Create a `.env` file in your project root with the following variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dots/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    match /manifest/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dots/{allPaths=**} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

## How it Works

- Users click on dots on the 3D globe to upload images
- Images are stored in Firebase Storage under the `dots/` folder
- Image metadata (URL, file info, timestamps) is saved in Firestore `dots` collection
- A manifest of all uploaded dots is maintained in Firestore `manifest` collection
- The app loads existing images from Firebase when the globe initializes
