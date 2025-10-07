import { useState } from 'react';
import './EmailModal.css';

export const EmailModal = ({ isOpen, onClose, onSubmit, dotId, fileName, fileSize, isLoading }) => {
  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(value === '' || validateEmail(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setIsValidEmail(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setIsValidEmail(false);
      return;
    }
    
    onSubmit(email.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setIsValidEmail(true);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="email-modal-overlay">
      <div className="email-modal">
        <div className="email-modal-header">
          <h3>📧 Submit Image for Approval</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="email-modal-content">
          <div className="upload-info">
            <p><strong>Dot ID:</strong> {dotId}</p>
            <p><strong>File:</strong> {fileName}</p>
            <p><strong>Size:</strong> {formatFileSize(fileSize)}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="email-form">
            <div className="form-group">
              <label htmlFor="email">Your Email Address:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className={isValidEmail ? 'email-input' : 'email-input error'}
                disabled={isLoading}
                autoFocus
              />
              {!isValidEmail && (
                <span className="error-message">Please enter a valid email address</span>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={!email.trim() || !isValidEmail || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit for Approval'
                )}
              </button>
            </div>
          </form>
          
          <div className="info-text">
            <p>📝 Your image will be sent to admin for approval before appearing on the globe.</p>
            <p>📧 You'll receive an email confirmation once your image is reviewed.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
