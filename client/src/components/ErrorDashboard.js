import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ErrorLogList from './ErrorLogList';
import ErrorStats from './ErrorStats';
import ErrorLogForm from './ErrorLogForm';
import MonitoringControls from './MonitoringControls';

function ErrorDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    service: '',
    errorType: '',
    isArchived: 'false', // Always show only active errors
    page: 1,
    limit: 20
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await api.getLogs(filters);
      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await api.getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleLogCreated = () => {
    setShowForm(false);
    loadLogs();
    loadStats();
  };

  return (
    <div className="error-dashboard">
      <header className="dashboard-header">
        <h1>🛡️ GlitchGuard Error Management</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Log New Error'}
        </button>
      </header>

      {showForm && (
        <ErrorLogForm 
          onSuccess={handleLogCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      <MonitoringControls onStatusChange={() => loadLogs()} />

      <ErrorStats stats={stats} />

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
                isArchived: 'false',
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
        <div className="loading">Loading error logs...</div>
      ) : (
        <ErrorLogList logs={logs} />
      )}
    </div>
  );
}

export default ErrorDashboard;
