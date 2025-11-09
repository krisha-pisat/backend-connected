import React from 'react';
import './AuditLogList.css';

function AuditLogList({ logs }) {
  if (logs.length === 0) {
    return (
      <div className="no-logs">
        <p>No audit logs found. API calls will appear here once tracked.</p>
      </div>
    );
  }

  const getMethodColor = (method) => {
    const colors = {
      GET: '#61aff0',
      POST: '#49cc90',
      PUT: '#fca130',
      DELETE: '#f93e3e',
      PATCH: '#50e3c2'
    };
    return colors[method] || '#666';
  };

  const getStatusCodeColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return '#49cc90';
    if (statusCode >= 300 && statusCode < 400) return '#61aff0';
    if (statusCode >= 400 && statusCode < 500) return '#fca130';
    if (statusCode >= 500) return '#f93e3e';
    return '#666';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatResponseTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="audit-log-list">
      <h2>API Audit Logs ({logs.length})</h2>
      <div className="logs-container">
        {logs.map((log) => (
          <div key={log._id} className="audit-log-card">
            <div className="log-header">
              <div className="log-method-endpoint">
                <span
                  className="method-badge"
                  style={{ backgroundColor: getMethodColor(log.method) }}
                >
                  {log.method}
                </span>
                <span className="endpoint">{log.endpoint}</span>
                <span
                  className="status-badge"
                  style={{ color: getStatusCodeColor(log.statusCode) }}
                >
                  {log.statusCode}
                </span>
              </div>
              <div className="log-time">{formatDate(log.createdAt)}</div>
            </div>

            <div className="log-details">
              <div className="detail-item">
                <strong>IP:</strong> {log.ipAddress}
              </div>
              {log.sessionId && (
                <div className="detail-item">
                  <strong>Session:</strong> {log.sessionId.substring(0, 24)}...
                </div>
              )}
              {log.userId && (
                <div className="detail-item">
                  <strong>User:</strong> {log.userId}
                </div>
              )}
              <div className="detail-item">
                <strong>Response Time:</strong> {formatResponseTime(log.responseTime)}
              </div>
            </div>

            {log.userAgent && (
              <div className="log-user-agent">
                <strong>User Agent:</strong> {log.userAgent.substring(0, 100)}
                {log.userAgent.length > 100 ? '...' : ''}
              </div>
            )}

            {log.requestBody && Object.keys(log.requestBody).length > 0 && (
              <details className="log-request-body">
                <summary>Request Body</summary>
                <pre>{JSON.stringify(log.requestBody, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuditLogList;
