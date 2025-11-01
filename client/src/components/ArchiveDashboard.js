import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ErrorLogList from './ErrorLogList';

function ArchiveDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    severity: '',
    service: '',
    errorType: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadArchivedLogs();
  }, [filters]);

  const loadArchivedLogs = async () => {
    try {
      setLoading(true);
      // Filter only archived logs
      const result = await api.getLogs({ ...filters, isArchived: 'true' });
      if (result.success) {
        setLogs(result.data.logs || []);
        setStats(result.data.stats || {});
      }
    } catch (error) {
      console.error('Failed to load archived logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (logId) => {
    if (!window.confirm('Are you sure you want to unarchive this error?')) {
      return;
    }
    
    try {
      const result = await api.unarchiveLog(logId);
      if (result.success) {
        alert('Error unarchived successfully! It will appear in the main error log.');
        loadArchivedLogs(); // Refresh the archived logs list
      } else {
        alert('Failed to unarchive error: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to unarchive log:', error);
      alert('Failed to unarchive error. Please try again.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const getStatsDisplay = () => {
    if (!stats || Object.keys(stats).length === 0) {
      return 'No archived errors yet';
    }
    const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
    return `Total Archived: ${total}`;
  };

  return (
    <div className="archive-dashboard">
      <header className="archive-header">
        <h1>📦 Archived Errors</h1>
        <div className="archive-stats">
          <span className="stats-badge">{getStatsDisplay()}</span>
          <button className="btn-secondary" onClick={loadArchivedLogs}>
            Refresh
          </button>
        </div>
      </header>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-item">
            <label>Severity</label>
            <select 
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Service</label>
            <input
              type="text"
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              placeholder="Filter by service..."
            />
          </div>

          <div className="filter-item">
            <label>Error Type</label>
            <select 
              value={filters.errorType}
              onChange={(e) => handleFilterChange('errorType', e.target.value)}
            >
              <option value="">All</option>
              <option value="browser">Browser</option>
              <option value="server">Server</option>
              <option value="database">Database</option>
            </select>
          </div>

          <div className="filter-item">
            <button 
              className="btn-secondary"
              onClick={() => setFilters({
                severity: '',
                service: '',
                errorType: '',
                page: 1,
                limit: 20
              })}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading archived logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <p>No archived errors found. Errors that meet retention rule criteria will appear here automatically.</p>
          <p className="info-text">
            💡 TIP: Create retention rules in the Retention Rules tab to automatically archive old errors.
          </p>
        </div>
      ) : (
        <ErrorLogList logs={logs} onUnarchive={handleUnarchive} />
      )}
    </div>
  );
}

export default ArchiveDashboard;

