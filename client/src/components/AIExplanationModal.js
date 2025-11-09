import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AIExplanationModal.css';

function AIExplanationModal({ errorLog, isOpen, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && errorLog) {
      // Check if we have a cached explanation first
      loadCachedExplanation();
    } else {
      // Reset state when modal closes
      setExplanation(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, errorLog]);

  const loadCachedExplanation = async () => {
    try {
      const result = await api.getAIExplanation(errorLog._id);
      if (result.success && result.cached) {
        setExplanation(result.explanation);
        setError(null);
      }
    } catch (err) {
      // No cached explanation, that's okay
      console.log('No cached explanation found');
    }
  };

  const generateExplanation = async () => {
    if (!errorLog) return;

    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const result = await api.generateAIExplanation(errorLog._id);
      if (result.success) {
        setExplanation(result.explanation);
      } else {
        setError(result.message || 'Failed to generate explanation');
      }
    } catch (err) {
      console.error('Failed to generate AI explanation:', err);
      setError(err.message || 'Failed to generate AI explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !errorLog) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2>🤖 AI Error Explanation</h2>
          <button className="ai-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ai-modal-body">
          <div className="error-context">
            <h3>Error Details</h3>
            <div className="error-summary">
              <p><strong>Message:</strong> {errorLog.message || 'N/A'}</p>
              <p><strong>Service:</strong> {errorLog.service || 'N/A'}</p>
              <p><strong>Severity:</strong> {errorLog.severity || 'N/A'}</p>
              {errorLog.url && <p><strong>URL:</strong> {errorLog.url}</p>}
            </div>
          </div>

          <div className="ai-explanation-section">
            {!explanation && !loading && !error && (
              <div className="ai-prompt">
                <p>Get an AI-powered explanation of this error to understand what went wrong and how to fix it.</p>
                <button 
                  className="btn-primary btn-generate"
                  onClick={generateExplanation}
                >
                  🚀 Generate AI Explanation
                </button>
              </div>
            )}

            {loading && (
              <div className="ai-loading">
                <div className="spinner"></div>
                <p>Analyzing error with AI...</p>
              </div>
            )}

            {error && (
              <div className="ai-error">
                <p>❌ {error}</p>
                <button 
                  className="btn-secondary"
                  onClick={generateExplanation}
                >
                  Try Again
                </button>
              </div>
            )}

            {explanation && (
              <div className="ai-explanation">
                <h3>💡 AI Analysis</h3>
                <div className="explanation-text">
                  {explanation.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                <button 
                  className="btn-secondary btn-regenerate"
                  onClick={generateExplanation}
                  disabled={loading}
                >
                  🔄 Regenerate Explanation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIExplanationModal;

