import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuditLogList from './AuditLogList';
import AuditStats from './AuditStats';
import MockGenerator from './MockGenerator';
import './AuditDashboard.css';

function AuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ipAddress: '',
    sessionId: '',
    endpoint: '',
    method: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await api.getAuditLogs(filters);
      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await api.getAuditStats(filters);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleMockGenerated = () => {
    loadLogs();
    loadStats();
  };

  return (
    <div className="audit-dashboard">
      <header className="audit-header">
        <h1>📊 Audit Log Dashboard</h1>
        <MockGenerator onGenerate={handleMockGenerated} />
      </header>

      <AuditStats stats={stats} />

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-item">
            <label>IP Address</label>
            <input
              type="text"
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              placeholder="Filter by IP..."
            />
          </div>

          <div className="filter-item">
            <label>Session ID</label>
            <input
              type="text"
              value={filters.sessionId}
              onChange={(e) => handleFilterChange('sessionId', e.target.value)}
              placeholder="Filter by session..."
            />
          </div>

          <div className="filter-item">
            <label>Endpoint</label>
            <input
              type="text"
              value={filters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              placeholder="Filter by endpoint..."
            />
          </div>

          <div className="filter-item">
            <label>Method</label>
            <select
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
            >
              <option value="">All</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div className="filter-item">
            <button
              className="btn-secondary"
              onClick={() => setFilters({
                ipAddress: '',
                sessionId: '',
                endpoint: '',
                method: '',
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
        <div className="loading">Loading audit logs...</div>
      ) : (
        <AuditLogList logs={logs} />
      )}
    </div>
  );
}

export default AuditDashboard;
