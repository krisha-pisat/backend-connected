/**
 * Mock data generator for testing the error management system
 * This can be used to simulate various error scenarios
 */

const mockErrors = [
  {
    severity: 'critical',
    service: 'payment-service',
    errorType: 'server',
    message: 'Payment gateway timeout',
    stackTrace: 'Error: Request timeout\n    at PaymentService.process (/app/services/payment.js:45:12)',
    url: '/api/payments/process',
    metadata: { orderId: 'ORD-12345', amount: 299.99 }
  },
  {
    severity: 'high',
    service: 'user-service',
    errorType: 'database',
    message: 'Database connection pool exhausted',
    stackTrace: 'Error: Too many connections\n    at Pool.getConnection (/app/db/pool.js:89:10)',
    url: '/api/users/profile',
    metadata: { userId: 'user-123' }
  },
  {
    severity: 'medium',
    service: 'frontend-app',
    errorType: 'browser',
    message: 'Uncaught TypeError: Cannot read property "map" of undefined',
    stackTrace: 'TypeError: Cannot read property "map" of undefined\n    at ProductList.render (ProductList.jsx:23:8)',
    url: '/products',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    metadata: { component: 'ProductList', page: '/products' }
  },
  {
    severity: 'low',
    service: 'analytics-service',
    errorType: 'server',
    message: 'Failed to track page view',
    url: '/api/analytics/track',
    metadata: { page: '/home', sessionId: 'sess-123' }
  },
  {
    severity: 'critical',
    service: 'auth-service',
    errorType: 'server',
    message: 'JWT token validation failed',
    stackTrace: 'Error: Invalid token signature\n    at AuthService.validateToken (/app/services/auth.js:78:15)',
    url: '/api/auth/verify',
    metadata: { tokenId: 'token-abc123' }
  },
  {
    severity: 'high',
    service: 'notification-service',
    errorType: 'server',
    message: 'Email service unavailable',
    stackTrace: 'Error: SMTP server connection refused\n    at EmailService.send (/app/services/email.js:34:9)',
    url: '/api/notifications/send',
    metadata: { recipient: 'user@example.com', type: 'welcome' }
  }
];

/**
 * Generate a random error from mock data
 */
function getRandomError() {
  return mockErrors[Math.floor(Math.random() * mockErrors.length)];
}

/**
 * Generate multiple errors for testing
 * @param {Number} count - Number of errors to generate
 */
function generateErrors(count = 10) {
  const errors = [];
  for (let i = 0; i < count; i++) {
    const baseError = getRandomError();
    errors.push({
      ...baseError,
      message: `${baseError.message} (Test ${i + 1})`,
      metadata: {
        ...baseError.metadata,
        testRun: i + 1,
        timestamp: new Date().toISOString()
      }
    });
  }
  return errors;
}

/**
 * Create test scenarios for repeated errors
 */
function createRepeatedErrorScenario(service, message, count = 5) {
  return Array(count).fill(null).map((_, index) => ({
    severity: index < 2 ? 'high' : 'medium',
    service,
    errorType: 'server',
    message,
    url: '/api/test',
    metadata: { occurrence: index + 1 }
  }));
}

module.exports = {
  mockErrors,
  getRandomError,
  generateErrors,
  createRepeatedErrorScenario
};
