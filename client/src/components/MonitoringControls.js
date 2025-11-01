import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './MonitoringControls.css';

function MonitoringControls({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const result = await api.getMonitoringStatus();
      if (result.success) {
        setStatus(result.data);
        if (onStatusChange) onStatusChange(result.data);
      }
    } catch (error) {
      console.error('Failed to load monitoring status:', error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await api.startMonitoring();
      if (result.success) {
        setStatus(result.status);
        loadStatus();
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const result = await api.stopMonitoring();
      if (result.success) {
        setStatus(result.status);
        loadStatus();
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const result = await api.triggerMonitoring();
      if (result.success) {
        alert(`✅ Monitoring triggered!\nMonitored: ${result.data.monitored} errors\nLogged: ${result.data.logged} new errors`);
        loadStatus();
      }
    } catch (error) {
      console.error('Failed to trigger monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div className="monitoring-loading">Loading monitoring status...</div>;
  }

  return (
    <div className="monitoring-controls">
      <div className="monitoring-status">
        <div className="status-indicator">
          <span className={`status-dot ${status.isRunning ? 'running' : 'stopped'}`}></span>
          <span className="status-text">
            {status.isRunning ? '🔄 Monitoring Active' : '⏹️  Monitoring Stopped'}
          </span>
        </div>
        <div className="status-details">
          <span>Services: {status.monitoredServices}</span>
          <span>Interval: {status.pollInterval / 1000}s</span>
        </div>
      </div>

      <div className="monitoring-actions">
        {!status.isRunning ? (
          <button
            className="btn-start"
            onClick={handleStart}
            disabled={loading}
          >
            ▶️ Start Monitoring
          </button>
        ) : (
          <button
            className="btn-stop"
            onClick={handleStop}
            disabled={loading}
          >
            ⏹️ Stop Monitoring
          </button>
        )}
        
        <button
          className="btn-trigger"
          onClick={handleTrigger}
          disabled={loading}
        >
          🎯 Trigger Now
        </button>
      </div>

      {status.services && status.services.length > 0 && (
        <div className="monitored-services">
          <strong>Monitored Services:</strong>
          <div className="services-list">
            {status.services.map(service => (
              <span key={service} className="service-tag">{service}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitoringControls;
