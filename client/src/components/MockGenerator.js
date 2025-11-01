import React, { useState } from 'react';
import api from '../services/api';
import './MockGenerator.css';

function MockGenerator({ onGenerate }) {
  const [count, setCount] = useState(5);
  const [includeRepeated, setIncludeRepeated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const response = await api.generateMockErrors(count, includeRepeated);
      setResult(response);
      
      if (response.success && onGenerate) {
        setTimeout(() => {
          onGenerate();
        }, 500);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Failed to generate mock errors'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mock-generator">
      <div className="mock-controls">
        <label>
          Count:
          <input
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            disabled={generating}
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeRepeated}
            onChange={(e) => setIncludeRepeated(e.target.checked)}
            disabled={generating}
          />
          Include Repeated Errors
        </label>

        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : '🎲 Generate Mock Errors'}
        </button>
      </div>

      {result && (
        <div className={`mock-result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <div className="result-header">
                ✅ Generated {result.data.count} mock errors
              </div>
              {result.data.emailAlerts > 0 && (
                <div className="email-alerts">
                  📧 {result.data.emailAlerts} email alerts triggered
                </div>
              )}
              <div className="tracking-info">
                IP: {result.trackingInfo?.ipAddress || 'N/A'} | 
                Session: {result.trackingInfo?.sessionId?.substring(0, 8) || 'N/A'}...
              </div>
            </>
          ) : (
            <div className="result-header">
              ❌ {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MockGenerator;
