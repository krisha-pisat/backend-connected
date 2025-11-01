const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Error Logs
  async getLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const url = `${API_BASE_URL}/logs${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  async createLog(errorData) {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });
    return response.json();
  },

  async getStats(dateRange = {}) {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const url = `${API_BASE_URL}/logs/stats${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  // Retention Rules
  async getRules() {
    const response = await fetch(`${API_BASE_URL}/rules`);
    return response.json();
  },

  async createRule(ruleData) {
    const response = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ruleData),
    });
    return response.json();
  },

  async updateRule(id, ruleData) {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ruleData),
    });
    return response.json();
  },

  async deleteRule(id) {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async toggleArchive(id, autoArchive) {
    const response = await fetch(`${API_BASE_URL}/rules/${id}/archive-toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ autoArchive }),
    });
    return response.json();
  },

  // Audit Logs
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const url = `${API_BASE_URL}/audit${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  async getAuditStats(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const url = `${API_BASE_URL}/audit/stats${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  // Mock Generator
  async generateMockErrors(count = 5, includeRepeated = false) {
    const response = await fetch(`${API_BASE_URL}/mock/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count, includeRepeated }),
    });
    return response.json();
  },

  // External API
  async getExternalServices() {
    const response = await fetch(`${API_BASE_URL}/external/services`);
    return response.json();
  },

  async getExternalErrors(count = 5) {
    const response = await fetch(`${API_BASE_URL}/external/errors?count=${count}`);
    return response.json();
  },

  async getServiceErrors(serviceName, count = 5) {
    const response = await fetch(`${API_BASE_URL}/external/${serviceName}/errors?count=${count}`);
    return response.json();
  },

  // Monitoring
  async getMonitoringStatus() {
    const response = await fetch(`${API_BASE_URL}/monitoring/status`);
    return response.json();
  },

  async startMonitoring() {
    const response = await fetch(`${API_BASE_URL}/monitoring/start`, {
      method: 'POST',
    });
    return response.json();
  },

  async stopMonitoring() {
    const response = await fetch(`${API_BASE_URL}/monitoring/stop`, {
      method: 'POST',
    });
    return response.json();
  },

  async triggerMonitoring() {
    const response = await fetch(`${API_BASE_URL}/monitoring/trigger`, {
      method: 'POST',
    });
    return response.json();
  },
};

export default api;
