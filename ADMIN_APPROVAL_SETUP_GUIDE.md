# Admin Approval System Setup Guide

## Overview

Your Globe Pixels app now has a complete admin approval system! Users must provide their email and submit images for admin approval before they appear on the globe.

## How It Works

### 🔄 **User Flow**
1. **User clicks on a dot** → File picker opens
2. **User selects image** → Email modal appears
3. **User enters email** → Image submitted for approval
4. **Admin gets notification** → Reviews and approves/rejects
5. **User gets email** → Confirmation of approval/rejection
6. **Approved images appear** → On the globe

### 🛡️ **Admin Flow**
1. **Admin receives email** → With image preview and approval links
2. **Admin visits special URL** → `/admin-[special-token]`
3. **Admin reviews images** → Sees all pending submissions
4. **Admin approves/rejects** → With optional notes
5. **Users get notified** → Via email about decision

## Setup Instructions

### 1. **Environment Variables**

Add these to your `.env` file:

```env
# Firebase Configuration (required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Email Configuration (optional - for real email service)
VITE_ADMIN_EMAIL=admin@yourdomain.com
VITE_EMAIL_SERVICE_URL=https://your-email-service.com/send

# Note: VITE_FIREBASE_STORAGE_BUCKET is not needed for Firestore-only mode
```

### 2. **Firebase Firestore Rules**

Update your Firestore rules to allow the new collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Approved images (appears on globe)
    match /dots/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    
    // Pending images (awaiting approval)
    match /pending_images/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    
    // Manifest (list of approved dots)
    match /manifest/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

### 3. **EmailJS Setup (Recommended)**

The system now uses EmailJS for real email notifications:

#### Quick Setup:
1. **Use your existing EmailJS account** (you already have this configured)
2. **Create two new email templates** (see `EMAILJS_SETUP_GUIDE.md`)
3. **Add environment variables** to your `.env` file

#### Environment Variables for EmailJS:
```env
# Your existing EmailJS configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# New templates for admin approval system
VITE_EMAILJS_TEMPLATE_ID_ADMIN=template_admin_approval
VITE_EMAILJS_TEMPLATE_ID_USER=template_user_confirmation
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

#### Fallback Option (No EmailJS):
- System will log all notifications to console
- Admin can check console for new submissions
- Users won't receive email confirmations

## Usage Instructions

### **For Users**

1. **Upload Image**:
   - Click on any dot on the globe
   - Select an image file
   - Enter your email address
   - Click "Submit for Approval"

2. **What Happens**:
   - Image is optimized to 500KB
   - Sent to admin for review
   - You'll get email confirmation
   - Image appears on globe after approval

### **For Admins**

1. **Access Admin Panel**:
   - Check console logs for admin URLs
   - Or generate new URL using the system
   - URLs look like: `/admin-abc123def456`

2. **Review Images**:
   - See all pending submissions
   - View image previews
   - Read user details
   - Add admin notes

3. **Approve/Reject**:
   - Click "Approve" to make image visible
   - Click "Reject" to decline submission
   - Add optional notes for users

## File Structure

```
src/
├── components/
│   ├── EmailModal.jsx          # Email input modal for users
│   ├── AdminPanel.jsx          # Admin interface for approvals
│   └── AdminApp.jsx            # Admin routing and access control
├── lib/
│   ├── email-service.js        # Email notification system
│   ├── pending-images.js       # Pending images management
│   ├── image-optimizer.js      # Image optimization utilities
│   └── firebase.js             # Firebase integration (updated)
└── Dots.jsx                    # Main component (updated)
```

## Key Features

### ✅ **Automatic Image Optimization**
- All images optimized to 500KB
- Maintains quality while reducing size
- Detailed optimization logging

### ✅ **Email Notifications**
- Admin gets notified of new submissions
- Users get confirmation emails
- Approval/rejection notifications

### ✅ **Admin Interface**
- Clean, responsive admin panel
- Image previews and details
- Bulk approval capabilities
- Admin notes system

### ✅ **Security**
- Special admin URLs with tokens
- Access control for admin panel
- Secure image storage in Firestore

### ✅ **User Experience**
- Simple email input modal
- Clear status messages
- Progress indicators
- Mobile-responsive design

## Console Output Examples

### **User Submission**
```
📁 Selected file: vacation-photo.jpg, size: 2048KB
⚡ Large image detected (2048KB), optimizing to 500KB...
📊 Image Optimization Results:
   Original: 2.05 MB
   Optimized: 487 KB
   Reduction: 76%
✅ Image submitted for approval: Dot 12345 by user@example.com
```

### **Admin Notification**
```
📧 ADMIN EMAIL NOTIFICATION
===========================
New image upload request:

User Email: user@example.com
Dot ID: 12345
File: vacation-photo.jpg
Size: 2.05 MB

Admin Panel: http://localhost:3000/admin-abc123def456
Approve: http://localhost:3000/admin-abc123def456/approve/12345
Reject: http://localhost:3000/admin-abc123def456/reject/12345
```

## Troubleshooting

### **Images Not Appearing**
1. Check if image was approved by admin
2. Verify Firestore rules allow read access
3. Check browser console for errors

### **Email Not Working**
1. Check if `VITE_EMAIL_SERVICE_URL` is set
2. Verify email service configuration
3. Check console for email errors

### **Admin Panel Not Loading**
1. Verify admin URL format: `/admin-[token]`
2. Check if token is valid (length >= 10)
3. Generate new admin URL if needed

### **Upload Failures**
1. Check Firebase configuration
2. Verify Firestore rules
3. Check image file size (should be < 10MB original)

## Production Considerations

### **Security**
- Implement proper admin authentication
- Use HTTPS for all communications
- Regular security audits

### **Performance**
- Monitor Firestore usage
- Implement image caching
- Consider CDN for approved images

### **Scalability**
- Set up email service for high volume
- Implement admin role management
- Add bulk approval features

## Support

If you need help:
1. Check console logs for detailed error messages
2. Verify all environment variables are set
3. Test with small images first
4. Check Firebase console for data

The system is designed to be robust and provide detailed logging for troubleshooting!
