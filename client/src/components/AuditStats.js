import React from 'react';
import './AuditStats.css';

function AuditStats({ stats }) {
  if (!stats) {
    return <div className="stats-loading">Loading audit statistics...</div>;
  }

  return (
    <div className="audit-stats">
      <h2>Audit Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{stats.totalRequests || 0}</div>
          <div className="stat-label">Total API Calls</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.uniqueIPs || 0}</div>
          <div className="stat-label">Unique IPs</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.uniqueSessions || 0}</div>
          <div className="stat-label">Unique Sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.avgResponseTime || 0}ms</div>
          <div className="stat-label">Avg Response Time</div>
        </div>
      </div>

      {stats.byMethod && Object.keys(stats.byMethod).length > 0 && (
        <div className="method-stats">
          <h3>By HTTP Method</h3>
          <div className="method-list">
            {Object.entries(stats.byMethod).map(([method, count]) => (
              <div key={method} className="method-item">
                <span className="method-name">{method}</span>
                <span className="method-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.statusCodes && Object.keys(stats.statusCodes).length > 0 && (
        <div className="status-stats">
          <h3>By Status Code</h3>
          <div className="status-list">
            {Object.entries(stats.statusCodes)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([code, count]) => (
                <div key={code} className="status-item">
                  <span className="status-code">{code}</span>
                  <span className="status-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditStats;
