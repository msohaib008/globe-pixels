// Email service for sending notifications to admin using EmailJS
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN || 'template_admin_approval';
const EMAILJS_TEMPLATE_ID_USER = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_USER || 'template_user_confirmation';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yourdomain.com';

/**
 * Send email notification to admin about pending image approval
 * @param {Object} data - Email data
 * @param {string} data.userEmail - User's email
 * @param {string} data.dotId - Dot ID
 * @param {string} data.imagePreview - Base64 image preview
 * @param {string} data.fileName - Original file name
 * @param {number} data.fileSize - File size
 */
export async function sendAdminApprovalEmail(data) {
  try {
    const { userEmail, dotId, imagePreview, fileName, fileSize } = data;
    
    // Check if EmailJS is configured
    if (EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY) {
      const templateParams = {
        to_name: 'Admin',
        to_email: ADMIN_EMAIL,
        from_name: userEmail,
        from_email: userEmail,
        dot_id: dotId,
        file_name: fileName,
        file_size: formatFileSize(fileSize),
        admin_panel_url: getAdminUrl(),
        approve_url: `${getAdminUrl()}/approve/${dotId}`,
        reject_url: `${getAdminUrl()}/reject/${dotId}`,
        message: `New image upload request from ${userEmail} for dot ${dotId}. File: ${fileName} (${formatFileSize(fileSize)}). Please review and approve or reject in the admin panel.`
      };
      
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_ADMIN,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('✅ Admin email sent via EmailJS:', result.text);
      return { success: true, method: 'emailjs' };
    }
    
    // Fallback: Log to console and show admin notification
    console.log(`
    📧 ADMIN EMAIL NOTIFICATION (EmailJS not configured)
    ====================================================
    New image upload request:
    
    User Email: ${userEmail}
    Dot ID: ${dotId}
    File: ${fileName}
    Size: ${formatFileSize(fileSize)}
    
    Admin Panel: ${getAdminUrl()}
    Approve: ${getAdminUrl()}/approve/${dotId}
    Reject: ${getAdminUrl()}/reject/${dotId}
    
    Image Preview: ${imagePreview.substring(0, 100)}...
    `);
    
    // Show browser notification if possible
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Image Upload Request', {
        body: `User ${userEmail} uploaded image for dot ${dotId}`,
        icon: imagePreview
      });
    }
    
    return { success: true, method: 'console-log' };
    
  } catch (error) {
    console.error('Failed to send admin email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to user
 * @param {Object} data - Email data
 * @param {string} data.userEmail - User's email
 * @param {string} data.dotId - Dot ID
 * @param {string} data.status - 'pending' | 'approved' | 'rejected'
 */
export async function sendUserConfirmationEmail(data) {
  try {
    const { userEmail, dotId, status } = data;
    
    // Check if EmailJS is configured
    if (EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY) {
      let templateParams;
      
      switch (status) {
        case 'pending':
          templateParams = {
            to_name: userEmail.split('@')[0], // Use email username as name
            to_email: userEmail,
            from_name: 'Globe Pixels Admin',
            from_email: ADMIN_EMAIL,
            dot_id: dotId,
            status: 'received',
            message: `Thank you for uploading an image to dot ${dotId}! Your image is currently pending admin approval and will appear on the globe once approved. You will receive another email once your image has been reviewed.`,
            globe_url: window.location.origin
          };
          break;
          
        case 'approved':
          templateParams = {
            to_name: userEmail.split('@')[0],
            to_email: userEmail,
            from_name: 'Globe Pixels Admin',
            from_email: ADMIN_EMAIL,
            dot_id: dotId,
            status: 'approved',
            message: `Great news! Your image for dot ${dotId} has been approved and is now visible on the globe.`,
            globe_url: window.location.origin
          };
          break;
          
        case 'rejected':
          templateParams = {
            to_name: userEmail.split('@')[0],
            to_email: userEmail,
            from_name: 'Globe Pixels Admin',
            from_email: ADMIN_EMAIL,
            dot_id: dotId,
            status: 'rejected',
            message: `Unfortunately, your image for dot ${dotId} was not approved. Please ensure your image follows our guidelines and try uploading again.`,
            globe_url: window.location.origin
          };
          break;
      }
      
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_USER,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log(`✅ User email sent via EmailJS: ${userEmail} - ${status} - Dot ${dotId}`, result.text);
      return { success: true, method: 'emailjs' };
    }
    
    // Fallback: Log to console
    console.log(`📧 User email (EmailJS not configured): ${userEmail} - ${status} - Dot ${dotId}`);
    return { success: true, method: 'console-log' };
    
  } catch (error) {
    console.error('Failed to send user email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get admin URL based on current domain
 */
function getAdminUrl() {
  const baseUrl = window.location.origin;
  return `${baseUrl}/admin-${generateAdminToken()}`;
}

/**
 * Generate a simple admin token (in production, use proper authentication)
 */
function generateAdminToken() {
  // Simple token generation - in production, use proper JWT or similar
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}${random}`;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if current URL is admin URL
 */
export function isAdminUrl() {
  return window.location.pathname.includes('/admin-');
}

/**
 * Extract admin token from URL
 */
export function getAdminToken() {
  const path = window.location.pathname;
  const match = path.match(/\/admin-(.+)/);
  return match ? match[1] : null;
}
