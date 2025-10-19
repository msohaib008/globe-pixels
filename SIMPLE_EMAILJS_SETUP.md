# Simplified EmailJS Setup Guide

## Overview

This guide shows how to set up EmailJS with a simplified template that uses only basic fields:
- `from_name` - Sender's name
- `to_name` - Recipient's name  
- `to_email` - Recipient's email
- `from_email` - Sender's email
- `message` - Complete message content

## Environment Variables

Create a `.env` file in your project root with these variables:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_TEMPLATE_ID=template_simple
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

## EmailJS Template Setup

### Create a Single Template

**Template ID**: `template_simple`

**Template Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Globe Pixels Notification</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header { 
            background: #007bff; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { 
            background: #f8f9fa; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
        }
        .message { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            white-space: pre-line;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌍 Globe Pixels</h1>
        <p>Notification System</p>
    </div>
    
    <div class="content">
        <h2>Hello {{to_name}}!</h2>
        
        <div class="message">
{{message}}
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent from Globe Pixels</p>
        <p>From: {{from_name}} ({{from_email}})</p>
        <p>To: {{to_name}} ({{to_email}})</p>
    </div>
</body>
</html>
```

### Template Variables

Your template only needs these 5 variables:
- `{{from_name}}` - Sender's name
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email
- `{{from_email}}` - Sender's email
- `{{message}}` - Complete message content

## How It Works

### Admin Emails

When an image is uploaded, the admin receives an email with:
- User details
- File information
- Download link for the image
- Admin panel links for approval/rejection

**Example Message**:
```
New image upload request from user@example.com for dot 12345.

File Details:
- File Name: image.jpg
- File Size: 2.5 MB
- Dot ID: 12345

Download Image: https://yourdomain.com/api/download-image/12345

Admin Panel: https://yourdomain.com/admin-abc123
Approve: https://yourdomain.com/admin-abc123/approve/12345
Reject: https://yourdomain.com/admin-abc123/reject/12345

Please review and approve or reject in the admin panel.
```

### User Emails

Users receive confirmation emails for:
- Pending status (image received)
- Approved status (image approved)
- Rejected status (image rejected)

**Example Messages**:

**Pending**:
```
Thank you for uploading an image to dot 12345! 

Your image is currently pending admin approval and will appear on the globe once approved. You will receive another email once your image has been reviewed.

Globe URL: https://yourdomain.com
```

**Approved**:
```
Great news! Your image for dot 12345 has been approved and is now visible on the globe.

You can view your image at: https://yourdomain.com
```

**Rejected**:
```
Unfortunately, your image for dot 12345 was not approved. 

Please ensure your image follows our guidelines and try uploading again.

Globe URL: https://yourdomain.com
```

## Setup Steps

1. **Create EmailJS Account**: Sign up at [emailjs.com](https://www.emailjs.com/)

2. **Create Email Service**: Set up an email service (Gmail, Outlook, etc.)

3. **Create Template**: Use the template above with ID `template_simple`

4. **Get Credentials**: Copy your Service ID and Public Key

5. **Create .env File**: Add the environment variables

6. **Test**: Upload an image to test the email system

## Benefits of This Approach

- **Simple**: Only 5 template variables to manage
- **Flexible**: All content is in the message field
- **Maintainable**: Easy to update message content
- **Universal**: Works for both admin and user emails
- **Download Links**: Admin can download images directly
- **No Size Limits**: Avoids EmailJS template variable limits

## Troubleshooting

### EmailJS Not Working
1. Check environment variables are set correctly
2. Verify Service ID and Public Key
3. Check template ID matches exactly
4. Test template in EmailJS dashboard

### Download Links Not Working
1. Ensure your server has an `/api/download-image/:dotId` endpoint
2. Check that the endpoint returns the image file
3. Verify the dotId parameter is correct

### Emails Not Received
1. Check spam folder
2. Verify email addresses are correct
3. Check EmailJS sending limits
4. Test with a simple template first

This simplified approach makes EmailJS setup much easier while maintaining all the functionality you need!
