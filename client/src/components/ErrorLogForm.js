import React, { useState } from 'react';
import api from '../services/api';
import './ErrorLogForm.css';

function ErrorLogForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    severity: 'medium',
    service: '',
    errorType: 'server',
    message: '',
    stackTrace: '',
    url: '',
    userAgent: '',
    metadata: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const errorData = {
        ...formData,
        metadata: formData.metadata ? JSON.parse(formData.metadata || '{}') : {}
      };

      const response = await api.createLog(errorData);
      setResult(response);

      if (response.success) {
        setTimeout(() => {
          onSuccess();
          // Reset form
          setFormData({
            severity: 'medium',
            service: '',
            errorType: 'server',
            message: '',
            stackTrace: '',
            url: '',
            userAgent: '',
            metadata: ''
          });
        }, 1500);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Failed to log error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillExamples = [
    {
      severity: 'critical',
      service: 'payment-service',
      errorType: 'server',
      message: 'Payment gateway timeout - connection failed',
      stackTrace: 'Error: Request timeout\n    at PaymentService.process (/app/services/payment.js:45:12)',
      url: '/api/payments/process'
    },
    {
      severity: 'high',
      service: 'user-service',
      errorType: 'database',
      message: 'Database connection pool exhausted',
      stackTrace: 'Error: Too many connections\n    at Pool.getConnection (/app/db/pool.js:89:10)',
      url: '/api/users/profile'
    },
    {
      severity: 'medium',
      service: 'frontend-app',
      errorType: 'browser',
      message: 'Uncaught TypeError: Cannot read property "map" of undefined',
      stackTrace: 'TypeError: Cannot read property "map" of undefined\n    at ProductList.render (ProductList.jsx:23:8)',
      url: '/products'
    }
  ];

  const fillExample = (example) => {
    setFormData(prev => ({
      ...prev,
      ...example,
      metadata: JSON.stringify({ example: true }, null, 2)
    }));
  };

  return (
    <div className="error-log-form-container">
      <div className="error-log-form">
        <h2>Log New Error</h2>
        
        <div className="quick-fill-section">
          <label>Quick Fill Examples:</label>
          <div className="example-buttons">
            {quickFillExamples.map((example, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-example"
                onClick={() => fillExample(example)}
              >
                {example.severity} - {example.service}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Severity *</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service *</label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleChange}
                placeholder="e.g., payment-service"
                required
              />
            </div>

            <div className="form-group">
              <label>Error Type *</label>
              <select
                name="errorType"
                value={formData.errorType}
                onChange={handleChange}
                required
              >
                <option value="browser">Browser</option>
                <option value="server">Server</option>
                <option value="database">Database</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Error Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe the error..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Stack Trace</label>
            <textarea
              name="stackTrace"
              value={formData.stackTrace}
              onChange={handleChange}
              placeholder="Error: ...&#10;    at ..."
              rows="5"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>URL</label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="/api/endpoint"
              />
            </div>

            <div className="form-group">
              <label>User Agent</label>
              <input
                type="text"
                name="userAgent"
                value={formData.userAgent}
                onChange={handleChange}
                placeholder="Browser user agent"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Metadata (JSON)</label>
            <textarea
              name="metadata"
              value={formData.metadata}
              onChange={handleChange}
              placeholder='{"key": "value"}'
              rows="3"
            />
          </div>

          {result && (
            <div className={`form-result ${result.success ? 'success' : 'error'}`}>
              {result.success ? '✅' : '❌'} {result.message}
              {result.emailAlert && (
                <div className="email-alert-info">
                  📧 Email Alert: {result.emailAlert}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Logging...' : 'Log Error'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ErrorLogForm;
