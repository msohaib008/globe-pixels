import { useState, useEffect } from 'react';
import { getAllImages, approveImage, rejectImage, getAllImageStats } from '../lib/pending-images';
import { sendUserConfirmationEmail } from '../lib/email-service';

export const AdminPanel = () => {
  const [allImages, setAllImages] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved'

  useEffect(() => {
    loadAllImages();
  }, []);

  const loadAllImages = async () => {
    try {
      setLoading(true);
      const images = await getAllImages();
      const statistics = await getAllImageStats();
      
      setAllImages(images);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load all images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dotId, userEmail) => {
    try {
      setActionLoading(dotId);
      
      const result = await approveImage(dotId, adminNotes);
      
      if (result.success) {
        // Send approval email to user
        await sendUserConfirmationEmail({
          userEmail: userEmail,
          dotId: dotId,
          status: 'approved'
        });
        
        // Reload data
        await loadAllImages();
        
        alert(`✅ Image approved for dot ${dotId}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to approve image:', error);
      alert(`❌ Failed to approve image: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (dotId, userEmail) => {
    try {
      setActionLoading(dotId);
      
      const result = await rejectImage(dotId, adminNotes);
      
      if (result.success) {
        // Send rejection email to user
        await sendUserConfirmationEmail({
          userEmail: userEmail,
          dotId: dotId,
          status: 'rejected'
        });
        
        // Reload data
        await loadAllImages();
        
        alert(`❌ Image rejected for dot ${dotId}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to reject image:', error);
      alert(`❌ Failed to reject image: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter images based on selected status
  const filteredImages = allImages.filter(image => {
    if (filterStatus === 'all') return true;
    return image.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading pending images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Panel - All Images</h1>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item approved">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-item rejected">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="filter-controls">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Images ({stats.total})</option>
            <option value="pending">Pending Only ({stats.pending})</option>
            <option value="approved">Approved Only ({stats.approved})</option>
          </select>
        </div>
      </div>

      <div className="admin-notes">
        <label htmlFor="admin-notes">Admin Notes (optional):</label>
        <textarea
          id="admin-notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes for approval/rejection..."
          rows={3}
        />
      </div>

      <div className="pending-images">
        {filteredImages.length === 0 ? (
          <div className="no-images">
            <p>🎉 No images found for the selected filter!</p>
          </div>
        ) : (
          filteredImages.map((image) => (
            <div key={image.id} className={`image-card ${image.status}`}>
              <div className="image-preview">
                <img 
                  src={image.imageData} 
                  alt={`Dot ${image.dotId}`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-error" style={{ display: 'none' }}>
                  <p>❌ Image failed to load</p>
                </div>
              </div>
              
              <div className="image-details">
                <div className="detail-row">
                  <strong>Dot ID:</strong> {image.dotId}
                </div>
                <div className="detail-row">
                  <strong>User Email:</strong> {image.userEmail}
                </div>
                <div className="detail-row">
                  <strong>File:</strong> {image.fileName}
                </div>
                <div className="detail-row">
                  <strong>Size:</strong> {formatFileSize(image.fileSize)}
                </div>
                <div className="detail-row">
                  <strong>Submitted:</strong> {formatDate(image.submittedAt || image.createdAt)}
                </div>
                {image.approvedAt && (
                  <div className="detail-row">
                    <strong>Approved:</strong> {formatDate(image.approvedAt)}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${image.status}`}>
                    {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
                  </span>
                </div>
                
                {image.adminNotes && (
                  <div className="detail-row">
                    <strong>Admin Notes:</strong> {image.adminNotes}
                  </div>
                )}
              </div>
              
              {image.status === 'pending' && (
                <div className="image-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(image.dotId, image.userEmail)}
                    disabled={actionLoading === image.dotId}
                  >
                    {actionLoading === image.dotId ? (
                      <>
                        <span className="spinner small"></span>
                        Processing...
                      </>
                    ) : (
                      '✅ Approve'
                    )}
                  </button>
                  
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(image.dotId, image.userEmail)}
                    disabled={actionLoading === image.dotId}
                  >
                    {actionLoading === image.dotId ? (
                      <>
                        <span className="spinner small"></span>
                        Processing...
                      </>
                    ) : (
                      '❌ Reject'
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .admin-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .admin-header {
          margin-bottom: 30px;
        }

        .admin-header h1 {
          color: #333;
          margin-bottom: 20px;
        }

        .filter-controls {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .filter-controls label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .filter-controls select {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .filter-controls select:focus {
          outline: none;
          border-color: #007bff;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }

        .stat-item.pending { border-left-color: #ffc107; }
        .stat-item.approved { border-left-color: #28a745; }
        .stat-item.rejected { border-left-color: #dc3545; }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .admin-notes {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .admin-notes label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .admin-notes textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
        }

        .admin-notes textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .pending-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .image-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }

        .image-card.pending { border-left-color: #ffc107; }
        .image-card.approved { border-left-color: #28a745; }
        .image-card.rejected { border-left-color: #dc3545; }

        .image-preview {
          width: 100%;
          height: 200px;
          overflow: hidden;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .image-error {
          color: #666;
          text-align: center;
        }

        .image-details {
          padding: 20px;
        }

        .detail-row {
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-row strong {
          min-width: 100px;
          color: #333;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.approved {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.rejected {
          background: #f8d7da;
          color: #721c24;
        }

        .image-actions {
          padding: 0 20px 20px;
          display: flex;
          gap: 10px;
        }

        .approve-btn, .reject-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .approve-btn {
          background: #28a745;
          color: white;
        }

        .approve-btn:hover:not(:disabled) {
          background: #218838;
        }

        .reject-btn {
          background: #dc3545;
          color: white;
        }

        .reject-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .approve-btn:disabled, .reject-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading {
          text-align: center;
          padding: 40px;
        }

        .no-images {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .admin-panel {
            padding: 15px;
          }

          .pending-images {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .image-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
