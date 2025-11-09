import React, { useState } from 'react';
import './ErrorLogList.css';
import AIExplanationModal from './AIExplanationModal';

function ErrorLogList({ logs, onUnarchive }) {
  const [selectedError, setSelectedError] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);

  if (logs.length === 0) {
    return (
      <div className="no-logs">
        <p>No error logs found. Try logging an error or adjusting your filters.</p>
      </div>
    );
  }

  const getSeverityBadgeClass = (severity) => {
    const classes = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low'
    };
    return classes[severity] || 'badge-default';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleAIExplanation = (log) => {
    setSelectedError(log);
    setShowAIModal(true);
  };

  const closeAIModal = () => {
    setShowAIModal(false);
    setSelectedError(null);
  };

  return (
    <div className="error-log-list">
      <h2>Error Logs ({logs.length})</h2>
      <div className="logs-container">
        {logs.map((log) => (
          <div key={log._id} className="error-log-card">
            <div className="log-header">
              <div className="log-severity-service">
                <span className={`severity-badge ${getSeverityBadgeClass(log.severity)}`}>
                  {log.severity.toUpperCase()}
                </span>
                <span className="service-name">{log.service}</span>
                <span className="error-type">{log.errorType}</span>
              </div>
              <div className="log-time">{formatDate(log.createdAt)}</div>
            </div>

            <div className="log-message">{log.message}</div>

            {log.url && (
              <div className="log-url">
                <strong>URL:</strong> {log.url}
              </div>
            )}

            <div className="log-tracking">
              {log.ipAddress && (
                <span className="tracking-item">
                  <strong>IP:</strong> {log.ipAddress}
                </span>
              )}
              {log.sessionId && (
                <span className="tracking-item">
                  <strong>Session:</strong> {log.sessionId.substring(0, 24)}...
                </span>
              )}
            </div>

            {log.stackTrace && (
              <details className="log-stacktrace">
                <summary>Stack Trace</summary>
                <pre>{log.stackTrace}</pre>
              </details>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <details className="log-metadata">
                <summary>Metadata</summary>
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </details>
            )}

            <div className="log-footer">
              <div className="log-badges">
                {log.metadata?.externalAPI && (
                  <span className="external-api-badge">🌐 External API</span>
                )}
                {log.metadata?.capturedFrom === 'console' && (
                  <span className="console-badge">🖥️ Console Error</span>
                )}
                {log.emailSent && (
                  <span className="email-sent-badge">📧 Email Alert Sent</span>
                )}
                {log.isArchived && (
                  <span className="archived-badge">📦 Archived</span>
                )}
                {log.aiExplanation && (
                  <span className="ai-badge" title="AI explanation available">🤖 AI Explained</span>
                )}
              </div>
              <div className="log-actions">
                <button 
                  className="btn-ai-explanation" 
                  onClick={() => handleAIExplanation(log)}
                  title="Get AI explanation for this error"
                >
                  🤖 AI Explanation
                </button>
                {log.isArchived && onUnarchive && (
                  <button 
                    className="btn-unarchive" 
                    onClick={() => onUnarchive(log._id)}
                    title="Unarchive this error"
                  >
                    ↻ Unarchive
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAIModal && selectedError && (
        <AIExplanationModal
          errorLog={selectedError}
          isOpen={showAIModal}
          onClose={closeAIModal}
        />
      )}
    </div>
  );
}

export default ErrorLogList;
