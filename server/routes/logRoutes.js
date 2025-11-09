const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const emailService = require('../services/emailService');

// Load AI explanation service only if available (optional feature)
let aiExplanationService = null;
try {
  aiExplanationService = require('../services/aiExplanationService');
  console.log('[EAMS] ✅ AI Explanation service loaded successfully');
} catch (error) {
  console.warn('[EAMS] ⚠️  AI Explanation service not available:', error.message);
  console.error('[EAMS] Error loading AI service:', error);
}

/**
 * GET /api/logs
 * View error logs with filters for severity, service, and date
 */
router.get('/', async (req, res) => {
  try {
    const {
      severity,
      service,
      errorType,
      startDate,
      endDate,
      isArchived,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (service) {
      filter.service = service;
    }
    
    if (errorType) {
      filter.errorType = errorType;
    }
    
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true';
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const logs = await ErrorLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ErrorLog.countDocuments(filter);

    // Aggregated stats for dashboard
    const stats = await ErrorLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs',
      error: error.message
    });
  }
});

/**
 * POST /api/logs
 * Log browser, server, or database errors
 */
router.post('/', async (req, res) => {
  try {
    const {
      severity,
      service,
      errorType,
      message,
      stackTrace,
      userAgent,
      url,
      userId,
      metadata
    } = req.body;

    // Validation
    if (!severity || !service || !errorType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: severity, service, errorType, message'
      });
    }

    // Get tracking info from request (set by tracking middleware)
    const trackingInfo = req.trackingInfo || {
      ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || 'unknown',
      sessionId: req.sessionId || req.cookies?.sessionId || 'unknown',
      userId: req.userId || userId || null
    };

    // Create error log with optional tracking fields (in case they don't exist in old schema)
    const errorLogData = {
      severity,
      service,
      errorType,
      message,
      stackTrace,
      userAgent: userAgent || req.get('user-agent'),
      url,
      userId: userId || trackingInfo.userId,
      metadata
    };

    // Only add tracking fields if they exist (for backward compatibility)
    if (trackingInfo.ipAddress && trackingInfo.ipAddress !== 'unknown') {
      errorLogData.ipAddress = trackingInfo.ipAddress;
    }
    if (trackingInfo.sessionId && trackingInfo.sessionId !== 'unknown') {
      errorLogData.sessionId = trackingInfo.sessionId;
    }

    const errorLog = new ErrorLog(errorLogData);

    await errorLog.save();

    // Check if email alert should be sent
    const shouldSend = await emailService.shouldSendEmail(errorLog);
    if (shouldSend && !errorLog.emailSent) {
      const reason = errorLog.severity === 'critical' ? 'severity' : 'repeated';
      await emailService.sendErrorAlert(errorLog, reason);
      
      // Update error log to mark email as sent
      errorLog.emailSent = true;
      errorLog.emailSentAt = new Date();
      await errorLog.save();
    }

    res.status(201).json({
      success: true,
      message: 'Error logged successfully',
      data: errorLog,
      emailAlert: shouldSend ? 'sent' : 'not required'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to log error',
      error: error.message
    });
  }
});

/**
 * PATCH /api/logs/:id/unarchive
 * Unarchive an error log
 */
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const { id } = req.params;

    const errorLog = await ErrorLog.findById(id);
    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    if (!errorLog.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Error log is not archived'
      });
    }

    // Unarchive the error and set archivedTime to now
    errorLog.isArchived = false;
    errorLog.archivedTime = new Date();
    await errorLog.save();

    res.json({
      success: true,
      message: 'Error log unarchived successfully',
      data: errorLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unarchive error log',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/stats
 * Get aggregated statistics for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await ErrorLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bySeverity: {
            $push: '$severity'
          },
          byService: {
            $push: '$service'
          },
          byErrorType: {
            $push: '$errorType'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          bySeverity: {},
          byService: {},
          byErrorType: {}
        }
      });
    }

    const result = stats[0];
    
    // Count occurrences
    const severityCount = result.bySeverity.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const serviceCount = result.byService.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const errorTypeCount = result.byErrorType.reduce((acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: result.total,
        bySeverity: severityCount,
        byService: serviceCount,
        byErrorType: errorTypeCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/logs/:id/ai-explanation
 * Generate AI explanation for an error log
 * NOTE: This route must come before any generic /:id route to avoid conflicts
 */
router.post('/:id/ai-explanation', async (req, res) => {
  console.log('[AI] POST /api/logs/:id/ai-explanation called with id:', req.params.id);
  console.log('[AI] aiExplanationService available:', !!aiExplanationService);
  
  try {
    if (!aiExplanationService) {
      console.error('[AI] Service not available');
      return res.status(503).json({
        success: false,
        message: 'AI Explanation service is not available. Please check server configuration.'
      });
    }

    const { id } = req.params;
    console.log('[AI] Looking for error log with id:', id);

    const errorLog = await ErrorLog.findById(id);
    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    // Check if we already have a cached explanation (optional - can regenerate if needed)
    // For now, we'll always generate fresh explanations

    // Generate AI explanation
    const result = await aiExplanationService.generateExplanation(errorLog);

    if (result.success) {
      // Optionally cache the explanation in the database
      errorLog.aiExplanation = result.explanation;
      errorLog.aiExplanationGeneratedAt = new Date();
      await errorLog.save();

      res.json({
        success: true,
        explanation: result.explanation,
        model: result.model,
        cached: false
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI explanation',
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI Explanation Error:', error);
    console.error('Error Stack:', error.stack);
    
    // Provide more detailed error message
    let errorMessage = error.message || 'Failed to generate AI explanation';
    
    if (error.message && error.message.includes('GROQ_API_KEY')) {
      errorMessage = 'Groq API key is not configured. Please set GROQ_API_KEY in your .env file.';
    } else if (error.message && error.message.includes('Invalid Groq API key')) {
      errorMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY in the .env file.';
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI explanation',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/logs/:id/ai-explanation
 * Get cached AI explanation for an error log (if available)
 * NOTE: This route must come before any generic /:id route to avoid conflicts
 */
router.get('/:id/ai-explanation', async (req, res) => {
  console.log('[AI] GET /api/logs/:id/ai-explanation called with id:', req.params.id);
  
  try {
    const { id } = req.params;

    const errorLog = await ErrorLog.findById(id);
    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    if (errorLog.aiExplanation) {
      res.json({
        success: true,
        explanation: errorLog.aiExplanation,
        cached: true,
        generatedAt: errorLog.aiExplanationGeneratedAt
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No cached AI explanation found. Use POST to generate one.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI explanation',
      error: error.message
    });
  }
});

module.exports = router;
