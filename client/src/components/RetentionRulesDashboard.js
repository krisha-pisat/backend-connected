import React, { useState, useEffect } from 'react';
import api from '../services/api';
//import './RetentionRulesDashboard.css';

const severityOptions = ['low', 'medium', 'high', 'critical'];
const errorTypeOptions = ['browser', 'server', 'database'];
const retentionUnits = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' }
];

function RetentionRulesDashboard() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedSeverity: [],
    servicesText: '',
    selectedErrorTypes: [],
    retentionDuration: 30,
    retentionUnit: 'days',
    autoArchive: true,
    isActive: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const result = await api.getRules();
      if (result.success) {
        setRules(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load retention rules:', error);
      setErrorMessage('Failed to load retention rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (list, value) => {
    if (list.includes(value)) {
      return list.filter(item => item !== value);
    }
    return [...list, value];
  };

  const handleCreateRule = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const services = formData.servicesText
        .split(',')
        .map(service => service.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        conditions: {
          severity: formData.selectedSeverity,
          service: services,
          errorType: formData.selectedErrorTypes
        },
        retentionDuration: Number(formData.retentionDuration),
        retentionUnit: formData.retentionUnit,
        autoArchive: formData.autoArchive
      };

      if (!payload.name) {
        setErrorMessage('Rule name is required');
        setSubmitting(false);
        return;
      }

      if (isNaN(payload.retentionDuration) || payload.retentionDuration <= 0) {
        setErrorMessage('Retention duration must be a positive number');
        setSubmitting(false);
        return;
      }

      const result = await api.createRule(payload);
      if (!result.success) {
        setErrorMessage(result.message || 'Failed to create rule');
      } else {
        setSuccessMessage('Retention rule created successfully');
        setShowForm(false);
        setFormData({
          name: '',
          description: '',
          selectedSeverity: [],
          servicesText: '',
          selectedErrorTypes: [],
          retentionDuration: 30,
          retentionUnit: 'days',
          autoArchive: true,
          isActive: true
        });
        loadRules();
      }
    } catch (error) {
      console.error('Failed to create retention rule:', error);
      setErrorMessage(error.message || 'Failed to create retention rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutoArchive = async (rule) => {
    try {
      const result = await api.toggleArchive(rule._id, !rule.autoArchive);
      if (result.success) {
        loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle auto-archive:', error);
      setErrorMessage('Failed to toggle auto-archive');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const result = await api.updateRule(rule._id, { isActive: !rule.isActive });
      if (result.success) {
        loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle active state:', error);
      setErrorMessage('Failed to toggle active state');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this retention rule?')) {
      return;
    }

    try {
      const result = await api.deleteRule(ruleId);
      if (result.success) {
        loadRules();
      }
    } catch (error) {
      console.error('Failed to delete retention rule:', error);
      setErrorMessage('Failed to delete retention rule');
    }
  };

  const formatRetention = (rule) => {
    const duration = rule.retentionDuration ?? rule.retentionDays;
    const unit = rule.retentionUnit || 'days';
    if (duration === undefined) return 'N/A';
    return `${duration} ${unit}`;
  };

  const formatConditions = (rule) => {
    const { severity = [], service = [], errorType = [] } = rule.conditions || {};
    const parts = [];
    if (severity.length) parts.push(`Severity: ${severity.join(', ')}`);
    if (service.length) parts.push(`Service: ${service.join(', ')}`);
    if (errorType.length) parts.push(`Type: ${errorType.join(', ')}`);
    return parts.length ? parts.join(' | ') : 'All errors';
  };

  return (
    <div className="retention-dashboard">
      <header className="retention-header">
        <h1>🗂️ Retention Rules</h1>
        <div className="retention-actions">
          <button className="btn-secondary" onClick={loadRules}>Refresh</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Retention Rule'}
          </button>
        </div>
      </header>

      {errorMessage && <div className="alert error">{errorMessage}</div>}
      {successMessage && <div className="alert success">{successMessage}</div>}

      {showForm && (
        <form className="retention-form" onSubmit={handleCreateRule}>
          <div className="form-row">
            <div className="form-group">
              <label>Rule Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Retention Duration *</label>
              <div className="duration-group">
                <input
                  type="number"
                  min="1"
                  value={formData.retentionDuration}
                  onChange={(e) => setFormData({ ...formData, retentionDuration: e.target.value })}
                  required
                />
                <select
                  value={formData.retentionUnit}
                  onChange={(e) => setFormData({ ...formData, retentionUnit: e.target.value })}
                >
                  {retentionUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
              <small>Example: 10 minutes, 2 hours, 30 days</small>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Severity</label>
              <div className="checkbox-group">
                {severityOptions.map(option => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={formData.selectedSeverity.includes(option)}
                      onChange={() => setFormData({
                        ...formData,
                        selectedSeverity: handleCheckboxChange(formData.selectedSeverity, option)
                      })}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Error Types</label>
              <div className="checkbox-group">
                {errorTypeOptions.map(option => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={formData.selectedErrorTypes.includes(option)}
                      onChange={() => setFormData({
                        ...formData,
                        selectedErrorTypes: handleCheckboxChange(formData.selectedErrorTypes, option)
                      })}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Services (comma separated)</label>
            <input
              type="text"
              value={formData.servicesText}
              onChange={(e) => setFormData({ ...formData, servicesText: e.target.value })}
              placeholder="e.g., payment-service, auth-service"
            />
          </div>

          <div className="form-row">
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={formData.autoArchive}
                onChange={(e) => setFormData({ ...formData, autoArchive: e.target.checked })}
              />
              Enable auto-archive for this rule
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      )}

      <div className="rules-list">
        {loading ? (
          <div className="loading">Loading retention rules...</div>
        ) : rules.length === 0 ? (
          <div className="empty-state">
            <p>No retention rules configured yet.</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>Create a Rule</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Retention</th>
                <th>Conditions</th>
                <th>Status</th>
                <th>Last Run</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule._id} className={!rule.isActive ? 'inactive-row' : ''}>
                  <td>
                    <div className="rule-name">{rule.name}</div>
                    {rule.description && <div className="rule-description">{rule.description}</div>}
                  </td>
                  <td>{formatRetention(rule)}</td>
                  <td>{formatConditions(rule)}</td>
                  <td>
                    <div className="status-badges">
                      <span className={`badge ${rule.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`badge ${rule.autoArchive ? 'badge-auto' : 'badge-manual'}`}>
                        {rule.autoArchive ? 'Auto-archive' : 'Manual'}
                      </span>
                    </div>
                  </td>
                  <td>{rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : 'Never'}</td>
                  <td className="actions">
                    <button
                      className="btn-small"
                      onClick={() => handleToggleAutoArchive(rule)}
                    >
                      {rule.autoArchive ? 'Disable Auto' : 'Enable Auto'}
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => handleToggleActive(rule)}
                    >
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => handleDeleteRule(rule._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RetentionRulesDashboard;
