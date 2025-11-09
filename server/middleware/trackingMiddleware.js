const { v4: uuidv4 } = require('uuid');
const AuditLog = require('../models/AuditLog');

/**
 * Modular tracking middleware that can be used in any Express project
 * Tracks IP addresses, sessions, and API calls
 */
class TrackingMiddleware {
  constructor(options = {}) {
    this.projectId = options.projectId || process.env.PROJECT_ID || 'default';
    this.enableAuditLogging = options.enableAuditLogging !== false; // Default: true
    this.excludedPaths = options.excludedPaths || ['/health', '/favicon.ico'];
    this.getUserId = options.getUserId || ((req) => req.user?.id || req.userId || null);
  }

  /**
   * Get client IP address from request
   */
  getClientIP(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Get or create session ID from request
   */
  getSessionId(req) {
    // Check if session ID already exists in request
    if (req.sessionId) {
      return req.sessionId;
    }

    // Check for session ID in cookies or headers
    const sessionFromCookie = req.cookies?.sessionId || req.cookies?.['connect.sid'];
    const sessionFromHeader = req.headers['x-session-id'];

    if (sessionFromCookie || sessionFromHeader) {
      return sessionFromCookie || sessionFromHeader;
    }

    // Generate new session ID
    const newSessionId = uuidv4();
    req.sessionId = newSessionId;
    return newSessionId;
  }

  /**
   * Middleware to capture IP and session
   */
  captureRequestInfo() {
    return (req, res, next) => {
      // Skip excluded paths
      if (this.excludedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Capture IP and session
      req.clientIP = this.getClientIP(req);
      req.sessionId = this.getSessionId(req);
      req.userId = this.getUserId(req);

      // Attach to request for use in routes
      req.trackingInfo = {
        ipAddress: req.clientIP,
        sessionId: req.sessionId,
        userId: req.userId,
        projectId: this.projectId
      };

      next();
    };
  }

  /**
   * Middleware to log API calls to audit log
   */
  auditLogging() {
    return async (req, res, next) => {
      if (!this.enableAuditLogging) {
        return next();
      }

      // Skip excluded paths
      if (this.excludedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Skip audit logging for stats/status endpoints (frequently polled by frontend)
      // These create too much noise in audit logs
      const statsEndpoints = [
        '/api/audit/stats',
        '/api/logs/stats',
        '/api/monitoring/status',
        '/api/monitoring/stats',
        '/api/rules/stats'
      ];
      if (statsEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        return next();
      }

      // For EAMS internal API calls, only log meaningful actions (POST, PUT, DELETE, PATCH)
      // Skip all GET requests to EAMS APIs to reduce noise from dashboard refreshes
      // GET requests are just fetching data, not user actions
      if (req.method === 'GET') {
        return next(); // Skip all GET requests in EAMS (they're just data fetching)
      }

      const startTime = Date.now();
      const self = this;
      
      // Store the original send method with proper binding
      const originalSend = res.send.bind(res);
      
      // Override res.send to capture response data
      res.send = function(body) {
        // Restore original send immediately
        res.send = originalSend;
        
        const responseTime = Date.now() - startTime;

        // Log audit asynchronously (don't block response)
        setImmediate(async () => {
          try {
            const auditLog = new AuditLog({
              method: req.method,
              endpoint: req.path,
              statusCode: res.statusCode,
              ipAddress: req.clientIP || req.trackingInfo?.ipAddress || 'unknown',
              sessionId: req.sessionId || req.trackingInfo?.sessionId || 'unknown',
              userAgent: req.get('user-agent'),
              userId: req.userId || req.trackingInfo?.userId || null,
              requestBody: req.method !== 'GET' ? self.sanitizeRequestBody(req.body) : null,
              responseTime,
              projectId: self.projectId,
              metadata: {
                query: req.query,
                headers: self.sanitizeHeaders(req.headers)
              }
            });

            await auditLog.save();
          } catch (error) {
            // Don't fail request if audit logging fails
            console.error('Audit logging error:', error);
          }
        });

        // Call original send with proper context
        return originalSend(body);
      };

      next();
    };
  }

  /**
   * Sanitize request body to remove sensitive data
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apikey', 'api_key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize headers to remove sensitive data
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get complete tracking middleware
   */
  getMiddleware() {
    return [this.captureRequestInfo(), this.auditLogging()];
  }
}

// Export singleton instance
const trackingMiddleware = new TrackingMiddleware({
  projectId: process.env.PROJECT_ID || 'glitchguard',
  enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false'
});

module.exports = {
  TrackingMiddleware,
  trackingMiddleware
};
