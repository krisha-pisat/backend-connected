/**
 * Mock External API Service
 * Simulates external services (payment, user, notification, etc.) that send errors
 * This acts as a realistic external API resource that your error management system monitors
 */

const { generateErrors, getRandomError } = require('../utils/mockData');

class MockExternalAPIService {
  constructor() {
    this.services = [
      {
        name: 'payment-service',
        endpoint: '/api/external/payment/errors',
        errorRate: 0.1, // 10% chance of error per request
        description: 'Payment processing service errors'
      },
      {
        name: 'user-service',
        endpoint: '/api/external/user/errors',
        errorRate: 0.05, // 5% chance
        description: 'User management service errors'
      },
      {
        name: 'notification-service',
        endpoint: '/api/external/notification/errors',
        errorRate: 0.15, // 15% chance
        description: 'Notification service errors'
      },
      {
        name: 'auth-service',
        endpoint: '/api/external/auth/errors',
        errorRate: 0.08, // 8% chance
        description: 'Authentication service errors'
      },
      {
        name: 'analytics-service',
        endpoint: '/api/external/analytics/errors',
        errorRate: 0.03, // 3% chance
        description: 'Analytics service errors'
      }
    ];

    this.errorPool = this.generateErrorPool();
  }

  /**
   * Generate a pool of errors that can be returned
   */
  generateErrorPool() {
    const pool = [];
    
    // Generate 50 base errors
    const baseErrors = generateErrors(50);
    
    // Categorize by service
    this.services.forEach(service => {
      const serviceErrors = baseErrors
        .filter(e => Math.random() > 0.5) // Random selection
        .map(error => ({
          ...error,
          service: service.name,
          source: 'external-api',
          apiEndpoint: service.endpoint,
          metadata: {
            ...error.metadata,
            sourceService: service.name,
            externalAPI: true,
            apiVersion: '1.0'
          }
        }));

      pool.push(...serviceErrors.slice(0, 10)); // Keep 10 per service
    });

    return pool;
  }

  /**
   * Get errors from a specific service (simulates external API call)
   * @param {String} serviceName - Name of the service
   * @param {Number} count - Number of errors to return
   */
  getServiceErrors(serviceName, count = 1) {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      return {
        success: false,
        error: `Service ${serviceName} not found`,
        data: []
      };
    }

    // Filter errors for this service
    const serviceErrors = this.errorPool
      .filter(e => e.service === serviceName)
      .slice(0, count);

    // Simulate API response delay
    const delay = Math.random() * 100 + 50; // 50-150ms

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          service: serviceName,
          endpoint: service.endpoint,
          timestamp: new Date().toISOString(),
          count: serviceErrors.length,
          data: serviceErrors.map(error => ({
            ...error,
            id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            reportedAt: new Date().toISOString()
          }))
        });
      }, delay);
    });
  }

  /**
   * Get random errors from any service (simulates monitoring multiple services)
   * @param {Number} count - Number of errors to return
   */
  async getRandomErrors(count = 5) {
    const selectedServices = this.services
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, this.services.length));

    const allErrors = [];

    for (const service of selectedServices) {
      const errorsPerService = Math.ceil(count / selectedServices.length);
      const result = await this.getServiceErrors(service.name, errorsPerService);
      if (result.success && result.data) {
        allErrors.push(...result.data);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      count: allErrors.length,
      data: allErrors.slice(0, count)
    };
  }

  /**
   * Simulate a service throwing an error
   * @param {String} serviceName - Service that's reporting an error
   */
  async reportError(serviceName) {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      return {
        success: false,
        error: `Service ${serviceName} not found`
      };
    }

    // Check if this service should report an error based on error rate
    if (Math.random() > service.errorRate) {
      return {
        success: true,
        hasError: false,
        message: 'Service is operating normally'
      };
    }

    // Get a random error for this service
    const errorResult = await this.getServiceErrors(serviceName, 1);
    
    if (errorResult.success && errorResult.data.length > 0) {
      return {
        success: true,
        hasError: true,
        service: serviceName,
        endpoint: service.endpoint,
        timestamp: new Date().toISOString(),
        error: errorResult.data[0]
      };
    }

    return {
      success: true,
      hasError: false
    };
  }

  /**
   * Get list of available services
   */
  getAvailableServices() {
    return this.services.map(s => ({
      name: s.name,
      endpoint: s.endpoint,
      errorRate: s.errorRate,
      description: s.description
    }));
  }

  /**
   * Get error statistics by service
   */
  getErrorStats() {
    const stats = {};
    this.services.forEach(service => {
      const serviceErrors = this.errorPool.filter(e => e.service === service.name);
      stats[service.name] = {
        totalErrors: serviceErrors.length,
        bySeverity: serviceErrors.reduce((acc, e) => {
          acc[e.severity] = (acc[e.severity] || 0) + 1;
          return acc;
        }, {}),
        errorRate: service.errorRate
      };
    });
    return stats;
  }
}

// Export singleton instance
const mockExternalAPI = new MockExternalAPIService();

module.exports = mockExternalAPI;

