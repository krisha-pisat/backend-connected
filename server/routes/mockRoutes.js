const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const { generateErrors, getRandomError, createRepeatedErrorScenario } = require('../utils/mockData');
const emailService = require('../services/emailService');

/**
 * POST /api/mock/generate
 * Generate random mock errors
 */
router.post('/generate', async (req, res) => {
  try {
    const { count = 5, includeRepeated = false } = req.body;

    // Validate count
    const errorCount = Math.min(Math.max(parseInt(count) || 5, 1), 50); // Between 1 and 50

    // Get tracking info from request (set by tracking middleware)
    const trackingInfo = req.trackingInfo || {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      sessionId: req.sessionId || req.cookies?.sessionId || 'mock-session',
      userId: req.userId || null
    };

    // Generate mock errors
    const errors = generateErrors(errorCount);

    // Add tracking info to each error
    const errorsWithTracking = errors.map(error => ({
      ...error,
      ipAddress: trackingInfo.ipAddress,
      sessionId: trackingInfo.sessionId,
      userId: trackingInfo.userId,
      metadata: {
        ...error.metadata,
        generatedBy: 'mock-api',
        batchId: Date.now().toString()
      }
    }));

    // Optionally add repeated errors
    if (includeRepeated) {
      const repeatedErrors = createRepeatedErrorScenario(
        'notification-service',
        'Email service unavailable - SMTP connection refused',
        3
      ).map(error => ({
        ...error,
        ipAddress: trackingInfo.ipAddress,
        sessionId: trackingInfo.sessionId,
        userId: trackingInfo.userId,
        metadata: {
          ...error.metadata,
          generatedBy: 'mock-api',
          batchId: Date.now().toString(),
          isRepeated: true
        }
      }));

      errorsWithTracking.push(...repeatedErrors);
    }

    // Save all errors
    const savedErrors = [];
    const emailAlerts = [];

    for (const errorData of errorsWithTracking) {
      const errorLog = new ErrorLog(errorData);
      await errorLog.save();

      // Check if email alert should be sent
      const shouldSend = await emailService.shouldSendEmail(errorLog);
      if (shouldSend && !errorLog.emailSent) {
        const reason = errorLog.severity === 'critical' ? 'severity' : 'repeated';
        await emailService.sendErrorAlert(errorLog, reason);
        
        errorLog.emailSent = true;
        errorLog.emailSentAt = new Date();
        await errorLog.save();
        
        emailAlerts.push({
          errorId: errorLog._id,
          reason,
          severity: errorLog.severity
        });
      }

      savedErrors.push(errorLog);
    }

    res.json({
      success: true,
      message: `Generated ${savedErrors.length} mock errors`,
      data: {
        count: savedErrors.length,
        errors: savedErrors,
        emailAlerts: emailAlerts.length,
        emailAlertDetails: emailAlerts
      },
      trackingInfo: {
        ipAddress: trackingInfo.ipAddress,
        sessionId: trackingInfo.sessionId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate mock errors',
      error: error.message
    });
  }
});

/**
 * GET /api/mock/examples
 * Get example error templates
 */
router.get('/examples', (req, res) => {
  const examples = [
    {
      severity: 'critical',
      service: 'payment-service',
      errorType: 'server',
      message: 'Payment gateway timeout',
      description: 'Critical payment processing error'
    },
    {
      severity: 'high',
      service: 'user-service',
      errorType: 'database',
      message: 'Database connection pool exhausted',
      description: 'Database connectivity issue'
    },
    {
      severity: 'medium',
      service: 'frontend-app',
      errorType: 'browser',
      message: 'Uncaught TypeError: Cannot read property "map" of undefined',
      description: 'Frontend JavaScript error'
    }
  ];

  res.json({
    success: true,
    data: examples
  });
});

module.exports = router;
