/**
 * Error Monitoring Service
 * Monitors external APIs and automatically logs errors to the error management system
 * This service periodically polls external APIs and logs any errors found
 */

const ErrorLog = require('../models/ErrorLog');
const emailService = require('./emailService');

class ErrorMonitoringService {
  constructor() {
    this.isRunning = false;
    this.pollInterval = null;
    this.pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS) || 30000; // 30 seconds default
    this.externalAPI = require('./mockExternalAPIService');
    this.services = this.externalAPI.getAvailableServices();
  }

  /**
   * Fetch errors from external API and log them
   */
  async monitorAndLogErrors() {
    try {
      const result = await this.externalAPI.getRandomErrors(5);

      if (result.success && result.data.length > 0) {
        const errors = result.data;
        const loggedCount = await this.logErrorsToSystem(errors);
        
        console.log(`✅ Monitored ${errors.length} errors from external APIs, logged ${loggedCount} new errors`);
        return {
          success: true,
          monitored: errors.length,
          logged: loggedCount
        };
      }

      return {
        success: true,
        monitored: 0,
        logged: 0,
        message: 'No errors found in external APIs'
      };
    } catch (error) {
      console.error('❌ Error monitoring failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log errors from external APIs to the error management system
   * @param {Array} errors - Array of error objects from external APIs
   */
  async logErrorsToSystem(errors) {
    let loggedCount = 0;

    for (const error of errors) {
      try {
        // Check if error already exists (by message and service to avoid duplicates)
        const existing = await ErrorLog.findOne({
          message: error.message,
          service: error.service,
          'metadata.externalAPI': true,
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        });

        if (existing) {
          continue; // Skip if already logged recently
        }

        // Transform external API error to ErrorLog format
        const errorLogData = {
          severity: error.severity || 'medium',
          service: error.service,
          errorType: error.errorType || 'server',
          message: error.message,
          stackTrace: error.stackTrace || null,
          url: error.url || error.apiEndpoint || null,
          userAgent: error.userAgent || null,
          metadata: {
            ...error.metadata,
            source: 'external-api-monitoring',
            externalAPI: true,
            originalErrorId: error.id,
            monitoredAt: new Date().toISOString()
          }
        };

        const errorLog = new ErrorLog(errorLogData);
        await errorLog.save();

        // Check if email alert should be sent
        const shouldSend = await emailService.shouldSendEmail(errorLog);
        if (shouldSend && !errorLog.emailSent) {
          const reason = errorLog.severity === 'critical' ? 'severity' : 'repeated';
          await emailService.sendErrorAlert(errorLog, reason);
          
          errorLog.emailSent = true;
          errorLog.emailSentAt = new Date();
          await errorLog.save();
        }

        loggedCount++;
      } catch (err) {
        console.error(`Failed to log error from ${error.service}:`, err.message);
      }
    }

    return loggedCount;
  }

  /**
   * Start automatic monitoring (polling external APIs)
   */
  startMonitoring() {
    if (this.isRunning) {
      console.log('⚠️  Error monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting error monitoring service (polling every ${this.pollIntervalMs / 1000}s)...`);

    // Initial monitoring
    this.monitorAndLogErrors();

    // Set up polling interval
    this.pollInterval = setInterval(() => {
      this.monitorAndLogErrors();
    }, this.pollIntervalMs);
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('⏹️  Error monitoring service stopped');
  }

  /**
   * Manually trigger a monitoring cycle
   */
  async triggerMonitoring() {
    return await this.monitorAndLogErrors();
  }

  /**
   * Monitor a specific service
   */
  async monitorService(serviceName) {
    try {
      const result = await this.externalAPI.getServiceErrors(serviceName, 3);

      if (result.success && result.data) {
        const loggedCount = await this.logErrorsToSystem(result.data);
        return {
          success: true,
          service: serviceName,
          found: result.data.length,
          logged: loggedCount
        };
      }

      return {
        success: true,
        service: serviceName,
        found: 0,
        logged: 0
      };
    } catch (error) {
      return {
        success: false,
        service: serviceName,
        error: error.message
      };
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollIntervalMs,
      monitoredServices: this.services.length,
      services: this.services.map(s => s.name)
    };
  }
}

// Export singleton instance
const errorMonitoringService = new ErrorMonitoringService();

module.exports = errorMonitoringService;

