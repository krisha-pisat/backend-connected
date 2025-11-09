const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

/**
 * POST /api/audit
 * Create audit log from external services (like Notes app)
 */
router.post('/', async (req, res) => {
  try {
    const {
      method,
      endpoint,
      statusCode,
      ipAddress,
      sessionId,
      userAgent,
      userId,
      requestBody,
      responseTime,
      projectId,
      metadata
    } = req.body;

    // Validation - required fields
    if (!method || !endpoint || !statusCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: method, endpoint, statusCode'
      });
    }

    // Get tracking info from request (if not provided in body)
    const trackingInfo = req.trackingInfo || {
      ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || 'unknown',
      sessionId: req.sessionId || req.cookies?.sessionId || 'unknown',
      userId: req.userId || userId || null
    };

    // Create audit log
    const auditLogData = {
      method: method.toUpperCase(),
      endpoint,
      statusCode: parseInt(statusCode),
      ipAddress: ipAddress || trackingInfo.ipAddress || 'unknown',
      sessionId: sessionId || trackingInfo.sessionId || 'unknown',
      userAgent: userAgent || req.get('user-agent'),
      userId: userId || trackingInfo.userId || null,
      requestBody: requestBody || null,
      responseTime: responseTime || 0,
      projectId: projectId || trackingInfo.projectId || 'default',
      metadata: metadata || {}
    };

    const auditLog = new AuditLog(auditLogData);
    await auditLog.save();

    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: auditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create audit log',
      error: error.message
    });
  }
});

/**
 * GET /api/audit
 * Get audit logs with filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      ipAddress,
      sessionId,
      endpoint,
      method,
      statusCode,
      startDate,
      endDate,
      projectId,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};

    if (ipAddress) {
      filter.ipAddress = ipAddress;
    }

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    if (endpoint) {
      filter.endpoint = { $regex: endpoint, $options: 'i' };
    }

    if (method) {
      filter.method = method;
    }

    if (statusCode) {
      filter.statusCode = parseInt(statusCode);
    }

    if (projectId) {
      filter.projectId = projectId;
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
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    // Get unique IPs and sessions for filters
    const uniqueIPs = await AuditLog.distinct('ipAddress', filter);
    const uniqueSessions = await AuditLog.distinct('sessionId', filter);

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
        filters: {
          uniqueIPs: uniqueIPs.slice(0, 100), // Limit to 100
          uniqueSessions: uniqueSessions.slice(0, 100)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, ipAddress, sessionId } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    if (ipAddress) matchStage.ipAddress = ipAddress;
    if (sessionId) matchStage.sessionId = sessionId;

    const stats = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          uniqueIPs: { $addToSet: '$ipAddress' },
          uniqueSessions: { $addToSet: '$sessionId' },
          byMethod: { $push: '$method' },
          byStatusCode: { $push: '$statusCode' },
          avgResponseTime: { $avg: '$responseTime' },
          endpoints: { $push: '$endpoint' }
        }
      },
      {
        $project: {
          totalRequests: 1,
          uniqueIPs: { $size: '$uniqueIPs' },
          uniqueSessions: { $size: '$uniqueSessions' },
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          byMethod: {
            $arrayToObject: {
              $map: {
                input: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                as: 'method',
                in: {
                  k: '$$method',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byMethod',
                        as: 'm',
                        cond: { $eq: ['$$m', '$$method'] }
                      }
                    }
                  }
                }
              }
            }
          },
          statusCodes: {
            $reduce: {
              input: '$byStatusCode',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [[
                      { k: { $toString: '$$this' }, v: 1 }
                    ]]
                  }
                ]
              }
            }
          },
          topEndpoints: {
            $slice: [
              {
                $map: {
                  input: { $slice: ['$endpoints', 20] },
                  as: 'ep',
                  in: '$$ep'
                }
              },
              10
            ]
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRequests: 0,
          uniqueIPs: 0,
          uniqueSessions: 0,
          avgResponseTime: 0,
          byMethod: {},
          statusCodes: {}
        }
      });
    }

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/ip/:ip
 * Get detailed stats for a specific IP
 */
router.get('/ip/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    const { hours = 24 } = req.query;

    const stats = await AuditLog.getStatsByIP(ip, parseInt(hours));

    const recentLogs = await AuditLog.find({ ipAddress: ip })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        ipAddress: ip,
        stats: stats[0] || null,
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IP statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/session/:sessionId
 * Get logs for a specific session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const logs = await AuditLog.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const sessionStats = await AuditLog.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          uniqueIPs: { $addToSet: '$ipAddress' },
          firstRequest: { $min: '$createdAt' },
          lastRequest: { $max: '$createdAt' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        sessionId,
        logs,
        stats: sessionStats[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session logs',
      error: error.message
    });
  }
});

module.exports = router;
