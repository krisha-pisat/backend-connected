import React, { useState } from 'react';
import ErrorDashboard from './components/ErrorDashboard';
import AuditDashboard from './components/AuditDashboard';
import RetentionRulesDashboard from './components/RetentionRulesDashboard';
import ArchiveDashboard from './components/ArchiveDashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('errors');

  return (
    <div className="App">
      <div className="app-tabs">
        <button
          className={`tab-button ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          🛡️ Error Management
        </button>
        <button
          className={`tab-button ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('archive')}
        >
          📦 Archive
        </button>
        <button
          className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📊 Audit Logs
        </button>
        <button
          className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          🗂️ Retention Rules
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'errors' && <ErrorDashboard />}
        {activeTab === 'archive' && <ArchiveDashboard />}
        {activeTab === 'audit' && <AuditDashboard />}
        {activeTab === 'rules' && <RetentionRulesDashboard />}
      </div>
    </div>
  );
}

export default App;
