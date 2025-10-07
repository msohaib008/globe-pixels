import { useState, useEffect } from 'react';
import { AdminPanel } from './AdminPanel';
import { isAdminUrl, getAdminToken } from '../lib/email-service';

export const AdminApp = () => {
  const [isValidAdmin, setIsValidAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = () => {
    try {
      // Check if current URL is admin URL
      const isAdmin = isAdminUrl();
      const token = getAdminToken();
      
      if (isAdmin && token) {
        // In a real app, you'd validate the token against your backend
        // For now, we'll just check if it exists and has reasonable length
        if (token.length >= 10) {
          setIsValidAdmin(true);
          setAdminToken(token);
        } else {
          setIsValidAdmin(false);
        }
      } else {
        setIsValidAdmin(false);
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      setIsValidAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const generateNewAdminUrl = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const newToken = `${timestamp}${random}`;
    const newUrl = `${window.location.origin}/admin-${newToken}`;
    
    return newUrl;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Checking admin access...</p>
      </div>
    );
  }

  if (!isValidAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <h1>🚫 Access Denied</h1>
          <p>This is not a valid admin URL.</p>
          <p>Admin URLs should follow the format:</p>
          <code>/admin-[special-token]</code>
          
          <div className="admin-info">
            <h3>For Developers:</h3>
            <p>To create a new admin URL, you can:</p>
            <ol>
              <li>Use the email service to generate admin URLs automatically</li>
              <li>Create a new admin URL manually</li>
            </ol>
            
            <div className="generate-url">
              <button onClick={() => {
                const newUrl = generateNewAdminUrl();
                navigator.clipboard.writeText(newUrl);
                alert(`New admin URL copied to clipboard:\n${newUrl}`);
              }}>
                📋 Generate New Admin URL
              </button>
            </div>
          </div>
          
          <div className="current-url">
            <strong>Current URL:</strong> {window.location.href}
          </div>
        </div>
        
        <style jsx>{`
          .admin-access-denied {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          
          .access-denied-content {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
          }
          
          .access-denied-content h1 {
            color: #dc3545;
            margin-bottom: 20px;
          }
          
          .access-denied-content p {
            color: #666;
            margin-bottom: 15px;
          }
          
          code {
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            color: #e83e8c;
          }
          
          .admin-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          }
          
          .admin-info h3 {
            color: #333;
            margin-bottom: 10px;
          }
          
          .admin-info ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          
          .generate-url {
            margin-top: 20px;
          }
          
          .generate-url button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .generate-url button:hover {
            background: #0056b3;
          }
          
          .current-url {
            background: #fff3cd;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            word-break: break-all;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <div className="admin-header-bar">
        <div className="admin-info">
          <h2>🛡️ Admin Panel</h2>
          <span className="admin-token">Token: {adminToken?.substring(0, 8)}...</span>
        </div>
        <div className="admin-actions">
          <button 
            onClick={() => window.location.href = window.location.origin}
            className="back-to-site"
          >
            🌍 Back to Globe
          </button>
        </div>
      </div>
      
      <AdminPanel />
      
      <style jsx>{`
        .admin-app {
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        .admin-header-bar {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .admin-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .admin-info h2 {
          margin: 0;
          color: #333;
        }
        
        .admin-token {
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: #666;
        }
        
        .back-to-site {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .back-to-site:hover {
          background: #0056b3;
        }
        
        .admin-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .admin-header-bar {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          
          .admin-info {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};
