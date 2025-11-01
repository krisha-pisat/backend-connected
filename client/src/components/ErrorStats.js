import React from 'react';
import './ErrorStats.css';

function ErrorStats({ stats }) {
  if (!stats) {
    return <div className="stats-loading">Loading statistics...</div>;
  }

  const severityColors = {
    critical: '#dc3545',
    high: '#fd7e14',
    medium: '#ffc107',
    low: '#28a745'
  };

  const total = stats.total || 0;
  const bySeverity = stats.bySeverity || {};

  return (
    <div className="error-stats">
      <h2>Error Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Errors</div>
        </div>

        {Object.keys(severityColors).map(severity => {
          const count = bySeverity[severity] || 0;
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          
          return (
            <div 
              key={severity} 
              className="stat-card"
              style={{ borderLeftColor: severityColors[severity] }}
            >
              <div className="stat-value" style={{ color: severityColors[severity] }}>
                {count}
              </div>
              <div className="stat-label">
                {severity.charAt(0).toUpperCase() + severity.slice(1)} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>

      {stats.byService && Object.keys(stats.byService).length > 0 && (
        <div className="service-stats">
          <h3>By Service</h3>
          <div className="service-list">
            {Object.entries(stats.byService).map(([service, count]) => (
              <div key={service} className="service-item">
                <span className="service-name">{service}</span>
                <span className="service-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorStats;
