# EmailJS Setup Guide for Admin Approval System

## Overview

Your Globe Pixels app now uses EmailJS for sending real email notifications! This guide will help you set up EmailJS templates for the admin approval system.

**Note**: EmailJS has a 50KB limit on template variables. To stay within this limit, the admin email doesn't include image previews - admins will view images in the admin panel instead.

## Prerequisites

- EmailJS account (free at [emailjs.com](https://www.emailjs.com/))
- Your existing EmailJS service ID and public key

## Step 1: EmailJS Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Your existing EmailJS configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Admin approval system specific
VITE_EMAILJS_TEMPLATE_ID_ADMIN=template_admin_approval
VITE_EMAILJS_TEMPLATE_ID_USER=template_user_confirmation
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

## Step 2: Create EmailJS Templates

### Template 1: Admin Approval Notification

**Template ID**: `template_admin_approval`

**Template Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Image Upload Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .detail-row strong { color: #007bff; }
        .actions { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .btn-approve { background: #28a745; color: white; }
        .btn-reject { background: #dc3545; color: white; }
        .btn-admin { background: #6c757d; color: white; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ New Image Upload Request</h1>
            <p>Globe Pixels Admin Panel</p>
        </div>
        
        <div class="content">
            <div class="details">
                <div class="detail-row"><strong>User Email:</strong> {{from_email}}</div>
                <div class="detail-row"><strong>Dot ID:</strong> {{dot_id}}</div>
                <div class="detail-row"><strong>File Name:</strong> {{file_name}}</div>
                <div class="detail-row"><strong>File Size:</strong> {{file_size}}</div>
                <div class="detail-row"><strong>Submitted:</strong> {{submission_date}}</div>
            </div>
            
            <div class="actions">
                <a href="{{approve_url}}" class="btn btn-approve">✅ Approve Image</a>
                <a href="{{reject_url}}" class="btn btn-reject">❌ Reject Image</a>
                <a href="{{admin_panel_url}}" class="btn btn-admin">🛡️ Admin Panel</a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3>📝 Message:</h3>
                <p>{{message}}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent from Globe Pixels Admin System</p>
            <p>If you didn't expect this email, please ignore it.</p>
        </div>
    </div>
</body>
</html>
```

**Template Variables**:
- `{{to_name}}` - Admin name
- `{{to_email}}` - Admin email
- `{{from_name}}` - User email
- `{{from_email}}` - User email
- `{{dot_id}}` - Dot ID
- `{{file_name}}` - File name
- `{{file_size}}` - File size
- `{{admin_panel_url}}` - Admin panel URL
- `{{approve_url}}` - Direct approve link
- `{{reject_url}}` - Direct reject link
- `{{message}}` - Formatted message
- `{{submission_date}}` - Submission timestamp

### Template 2: User Confirmation

**Template ID**: `template_user_confirmation`

**Template Content**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Image Upload Status</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-pending { border-left: 4px solid #ffc107; background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .status-approved { border-left: 4px solid #28a745; background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .status-rejected { border-left: 4px solid #dc3545; background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 Globe Pixels</h1>
            <p>Image Upload Status Update</p>
        </div>
        
        <div class="content">
            <h2>Hello {{to_name}}!</h2>
            
            <div class="status-{{status}}">
                <h3>
                    {{#approved}}✅ Your Image Has Been Approved!{{/approved}}
                    {{#rejected}}❌ Image Upload Rejected{{/rejected}}
                    {{#received}}📧 Your Image Upload Has Been Received{{/received}}
                </h3>
                <p><strong>Dot ID:</strong> {{dot_id}}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>{{message}}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{globe_url}}" class="btn">🌍 View Globe</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for using Globe Pixels!</p>
            <p>This email was sent automatically. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
```

**Template Variables**:
- `{{to_name}}` - User name (extracted from email)
- `{{to_email}}` - User email
- `{{from_name}}` - Admin name
- `{{from_email}}` - Admin email
- `{{dot_id}}` - Dot ID
- `{{status}}` - Status (received/approved/rejected)
- `{{message}}` - Status message
- `{{globe_url}}` - Globe URL

## Step 3: Test Your Setup

### 1. Update Your Environment Variables

Make sure your `.env` file has all the required variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_TEMPLATE_ID_ADMIN=template_admin_approval
VITE_EMAILJS_TEMPLATE_ID_USER=template_user_confirmation
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### 2. Test Email Sending

1. **Start your development server**: `npm run dev`
2. **Upload an image**: Click on a dot and submit with your email
3. **Check console**: Look for "✅ Admin email sent via EmailJS" message
4. **Check your email**: You should receive the admin notification email
5. **Check admin panel**: Visit the admin URL to approve/reject

### 3. Test Admin Actions

1. **Access admin panel**: Use the URL from the email
2. **Approve an image**: Click the approve button
3. **Check user email**: User should receive approval confirmation
4. **Check globe**: Image should appear on the globe

## Step 4: Customize Templates

### Admin Email Customization

You can customize the admin email template to include:
- Your branding/logo
- Different color scheme
- Additional information
- Custom approval workflow

### User Email Customization

You can customize user emails to include:
- Your app branding
- Additional instructions
- Links to your website
- Support contact information

## Troubleshooting

### EmailJS Not Working

1. **Check environment variables**: Make sure all EmailJS variables are set
2. **Check template IDs**: Ensure template IDs match your EmailJS templates
3. **Check console errors**: Look for EmailJS error messages
4. **Test EmailJS directly**: Try sending a test email from EmailJS dashboard

### Templates Not Rendering

1. **Check variable names**: Ensure template variables match exactly
2. **Check HTML syntax**: Validate your template HTML
3. **Test in EmailJS**: Use EmailJS's template tester

### Emails Not Received

1. **Check spam folder**: Emails might be filtered
2. **Check email address**: Ensure admin email is correct
3. **Check EmailJS limits**: Free accounts have sending limits
4. **Check template errors**: Look for template rendering errors

## Advanced Features

### Email Templates with Images

The admin template includes base64 image previews. Make sure your EmailJS service supports:
- HTML emails
- Base64 image embedding
- Large email content

### Custom Email Styling

You can enhance the templates with:
- CSS frameworks (Bootstrap, Tailwind)
- Responsive design
- Dark mode support
- Custom fonts

### Email Analytics

EmailJS provides analytics for:
- Email delivery rates
- Open rates (if tracking enabled)
- Click rates
- Error rates

## Production Considerations

### Security

- **API Key Protection**: Never expose EmailJS private keys
- **Rate Limiting**: Implement rate limiting for email sending
- **Input Validation**: Validate all email inputs
- **Spam Prevention**: Implement CAPTCHA or similar

### Performance

- **Async Email Sending**: Don't block UI while sending emails
- **Error Handling**: Graceful fallbacks when email fails
- **Caching**: Cache admin URLs and tokens
- **Monitoring**: Monitor email delivery success rates

## Support

If you need help:
1. Check EmailJS documentation
2. Test templates in EmailJS dashboard
3. Check browser console for errors
4. Verify all environment variables are set correctly

Your admin approval system is now fully integrated with EmailJS for professional email notifications! 🎉
