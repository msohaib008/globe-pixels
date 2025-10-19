// Pending images management for admin approval system
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, fetchManifest, saveManifest, addDotToManifest } from './firebase.js';

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
    
    // Update Firebase manifest to include the approved dot
    try {
      const manifest = await fetchManifest();
      const updatedManifest = addDotToManifest(manifest, parseInt(dotId));
      await saveManifest(updatedManifest);
      console.log(`✅ Manifest updated with dot ${dotId}`);
    } catch (manifestError) {
      console.warn('Failed to update manifest:', manifestError);
    }
    
    // Remove from pending collection (approved images should not stay in pending)
    await deleteDoc(doc(db, PENDING_COLLECTION, dotId.toString()));
    
    console.log(`✅ Image approved and moved to approved collection: Dot ${dotId}`);
    
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
    
    // Remove from pending collection (rejected images should not stay in pending)
    await deleteDoc(doc(db, PENDING_COLLECTION, dotId.toString()));
    
    console.log(`❌ Image rejected and removed from pending: Dot ${dotId}`);
    
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
 * Get all images (pending + approved) for admin panel
 * @returns {Promise<Array>} - Array of all images with status
 */
export async function getAllImages() {
  try {
    const [pendingImages, approvedImages] = await Promise.all([
      getPendingImages(),
      getApprovedImages()
    ]);
    
    // Combine all images and sort by date
    const allImages = [
      ...pendingImages.map(img => ({ ...img, collection: 'pending' })),
      ...approvedImages.map(img => ({ ...img, collection: 'approved', status: 'approved' }))
    ];
    
    // Sort by date (newest first)
    allImages.sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
    
    return allImages;
    
  } catch (error) {
    console.error('Failed to get all images:', error);
    return [];
  }
}

/**
 * Get all approved images
 * @returns {Promise<Array>} - Array of approved images
 */
export async function getApprovedImages() {
  try {
    const approvedSnapshot = await getDocs(collection(db, APPROVED_COLLECTION));
    const approvedImages = [];
    
    approvedSnapshot.forEach((doc) => {
      approvedImages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by approval date (newest first)
    approvedImages.sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));
    
    return approvedImages;
    
  } catch (error) {
    console.error('Failed to fetch approved images:', error);
    return [];
  }
}

/**
 * Get statistics about all images
 * @returns {Promise<Object>} - Statistics object
 */
export async function getAllImageStats() {
  try {
    const [pendingImages, approvedImages] = await Promise.all([
      getPendingImages(),
      getApprovedImages()
    ]);
    
    const stats = {
      total: pendingImages.length + approvedImages.length,
      pending: pendingImages.length,
      approved: approvedImages.length,
      rejected: 0 // Rejected images are deleted, not stored
    };
    
    return stats;
    
  } catch (error) {
    console.error('Failed to get all image stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
  }
}

/**
 * Get statistics about pending images (legacy function for backward compatibility)
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
