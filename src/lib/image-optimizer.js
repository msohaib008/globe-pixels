// Image optimization utilities for Firestore storage

/**
 * Optimizes an image to a target file size using intelligent compression
 * @param {File} file - The original image file
 * @param {number} targetSizeKB - Target size in KB (default: 500)
 * @returns {Promise<Blob>} - Optimized image blob
 */
export function optimizeImageToSize(file, targetSizeKB = 500) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      const targetSizeBytes = targetSizeKB * 1024;
      
      // Start with reasonable dimensions (max 1200px)
      const maxDimension = 1200;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Binary search for optimal quality
      let quality = 0.8;
      let minQuality = 0.1;
      let maxQuality = 1.0;
      let iterations = 0;
      const maxIterations = 10;
      
      const tryCompress = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }
          
          iterations++;
          
          // Check if we've reached target size or max iterations
          if (blob.size <= targetSizeBytes || iterations >= maxIterations) {
            // If still too large, reduce dimensions further
            if (blob.size > targetSizeBytes && width > 200 && height > 200) {
              width *= 0.9;
              height *= 0.9;
              iterations = 0;
              quality = 0.8; // Reset quality
              setTimeout(tryCompress, 0);
            } else {
              resolve(blob);
            }
          } else {
            // Adjust quality based on current size
            if (blob.size > targetSizeBytes) {
              maxQuality = quality;
              quality = (minQuality + quality) / 2;
            } else {
              minQuality = quality;
              quality = (maxQuality + quality) / 2;
            }
            setTimeout(tryCompress, 0);
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Converts a file to base64 data URL
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Gets file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human-readable size (e.g., "1.2 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates if a file is a valid image
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid image
 */
export function isValidImage(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Shows optimization progress and results
 * @param {File} originalFile - Original file
 * @param {Blob} optimizedBlob - Optimized blob
 */
export function logOptimizationResults(originalFile, optimizedBlob) {
  const originalSize = formatFileSize(originalFile.size);
  const optimizedSize = formatFileSize(optimizedBlob.size);
  const reduction = Math.round((1 - optimizedBlob.size / originalFile.size) * 100);
  
  console.log(`📊 Image Optimization Results:`);
  console.log(`   Original: ${originalSize}`);
  console.log(`   Optimized: ${optimizedSize}`);
  console.log(`   Reduction: ${reduction}%`);
  
  if (reduction > 0) {
    console.log(`✅ Image successfully optimized!`);
  } else {
    console.log(`ℹ️ Image was already optimal size.`);
  }
}
