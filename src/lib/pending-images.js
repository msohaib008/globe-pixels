// Pending images management for admin approval system
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const PENDING_COLLECTION = 'pending_images';
const APPROVED_COLLECTION = 'dots';

/**
 * Submit image for admin approval
 * @param {Object} data - Image submission data
 * @param {string} data.dotId - Dot ID
 * @param {string} data.userEmail - User's email
 * @param {string} data.imageData - Base64 image data
 * @param {string} data.fileName - Original file name
 * @param {number} data.fileSize - File size
 * @param {string} data.fileType - File type
 * @returns {Promise<Object>} - Submission result
 */
export async function submitImageForApproval(data) {
  try {
    const { dotId, userEmail, imageData, fileName, fileSize, fileType } = data;
    
    const submissionData = {
      dotId: dotId,
      userEmail: userEmail,
      imageData: imageData,
      fileName: fileName,
      fileSize: fileSize,
      fileType: fileType,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      rejectedAt: null,
      adminNotes: ''
    };
    
    // Store in pending collection
    await setDoc(doc(db, PENDING_COLLECTION, dotId.toString()), submissionData);
    
    console.log(`✅ Image submitted for approval: Dot ${dotId} by ${userEmail}`);
    
    return {
      success: true,
      dotId: dotId,
      status: 'pending',
      message: 'Image submitted for admin approval'
    };
    
  } catch (error) {
    console.error('Failed to submit image for approval:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all pending images
 * @returns {Promise<Array>} - Array of pending images
 */
export async function getPendingImages() {
  try {
    const pendingSnapshot = await getDocs(collection(db, PENDING_COLLECTION));
    const pendingImages = [];
    
    pendingSnapshot.forEach((doc) => {
      pendingImages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by submission date (newest first)
    pendingImages.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    return pendingImages;
    
  } catch (error) {
    console.error('Failed to fetch pending images:', error);
    return [];
  }
}

/**
 * Approve a pending image
 * @param {string} dotId - Dot ID
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<Object>} - Approval result
 */
export async function approveImage(dotId, adminNotes = '') {
  try {
    // Get pending image data
    const pendingDoc = await getDoc(doc(db, PENDING_COLLECTION, dotId.toString()));
    
    if (!pendingDoc.exists()) {
      throw new Error('Pending image not found');
    }
    
    const pendingData = pendingDoc.data();
    
    // Create approved image data
    const approvedData = {
      dotId: dotId,
      imageData: pendingData.imageData,
      fileName: pendingData.fileName,
      originalFileSize: pendingData.fileSize,
      fileType: pendingData.fileType,
      userEmail: pendingData.userEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      adminNotes: adminNotes
    };
    
    // Store in approved collection
    await setDoc(doc(db, APPROVED_COLLECTION, dotId.toString()), approvedData);
    
    // Update pending document status
    await updateDoc(doc(db, PENDING_COLLECTION, dotId.toString()), {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      adminNotes: adminNotes
    });
    
    console.log(`✅ Image approved: Dot ${dotId}`);
    
    return {
      success: true,
      dotId: dotId,
      status: 'approved',
      userEmail: pendingData.userEmail,
      message: 'Image approved successfully'
    };
    
  } catch (error) {
    console.error('Failed to approve image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reject a pending image
 * @param {string} dotId - Dot ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Rejection result
 */
export async function rejectImage(dotId, reason = '') {
  try {
    // Get pending image data
    const pendingDoc = await getDoc(doc(db, PENDING_COLLECTION, dotId.toString()));
    
    if (!pendingDoc.exists()) {
      throw new Error('Pending image not found');
    }
    
    const pendingData = pendingDoc.data();
    
    // Update pending document status
    await updateDoc(doc(db, PENDING_COLLECTION, dotId.toString()), {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      adminNotes: reason
    });
    
    console.log(`❌ Image rejected: Dot ${dotId}`);
    
    return {
      success: true,
      dotId: dotId,
      status: 'rejected',
      userEmail: pendingData.userEmail,
      message: 'Image rejected'
    };
    
  } catch (error) {
    console.error('Failed to reject image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get image submission history for a user
 * @param {string} userEmail - User's email
 * @returns {Promise<Array>} - Array of user's submissions
 */
export async function getUserSubmissions(userEmail) {
  try {
    const pendingSnapshot = await getDocs(collection(db, PENDING_COLLECTION));
    const userSubmissions = [];
    
    pendingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userEmail === userEmail) {
        userSubmissions.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort by submission date (newest first)
    userSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    return userSubmissions;
    
  } catch (error) {
    console.error('Failed to fetch user submissions:', error);
    return [];
  }
}

/**
 * Delete a pending image (cleanup)
 * @param {string} dotId - Dot ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function deletePendingImage(dotId) {
  try {
    await deleteDoc(doc(db, PENDING_COLLECTION, dotId.toString()));
    
    console.log(`🗑️ Pending image deleted: Dot ${dotId}`);
    
    return {
      success: true,
      dotId: dotId,
      message: 'Pending image deleted'
    };
    
  } catch (error) {
    console.error('Failed to delete pending image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get statistics about pending images
 * @returns {Promise<Object>} - Statistics object
 */
export async function getPendingStats() {
  try {
    const pendingImages = await getPendingImages();
    
    const stats = {
      total: pendingImages.length,
      pending: pendingImages.filter(img => img.status === 'pending').length,
      approved: pendingImages.filter(img => img.status === 'approved').length,
      rejected: pendingImages.filter(img => img.status === 'rejected').length
    };
    
    return stats;
    
  } catch (error) {
    console.error('Failed to get pending stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
  }
}
