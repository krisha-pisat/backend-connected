/**
 * External API Routes
 * These routes simulate external services that your error management system monitors
 * Think of this as payment-service, user-service, etc. reporting their errors
 */

const express = require('express');
const router = express.Router();
const mockExternalAPI = require('../services/mockExternalAPIService');

/**
 * GET /api/external/services
 * List all available external services being monitored
 */
router.get('/services', (req, res) => {
  try {
    const services = mockExternalAPI.getAvailableServices();
    res.json({
      success: true,
      message: 'Available external services',
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

/**
 * GET /api/external/:serviceName/errors
 * Get errors from a specific external service
 * Simulates: GET https://payment-service.example.com/api/errors
 */
router.get('/:serviceName/errors', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { count = 5 } = req.query;

    const result = await mockExternalAPI.getServiceErrors(serviceName, parseInt(count) || 5);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      ...result,
      source: 'external-api',
      monitoredBy: 'glitchguard',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service errors',
      error: error.message
    });
  }
});

/**
 * GET /api/external/errors
 * Get errors from all monitored services
 */
router.get('/errors', async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const result = await mockExternalAPI.getRandomErrors(parseInt(count) || 10);

    res.json({
      ...result,
      source: 'external-api',
      monitoredBy: 'glitchguard',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch errors',
      error: error.message
    });
  }
});

/**
 * POST /api/external/:serviceName/report
 * Simulate a service reporting an error
 * This is what external services would call when they have an error
 */
router.post('/:serviceName/report', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const result = await mockExternalAPI.reportError(serviceName);

    res.json({
      ...result,
      reportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process error report',
      error: error.message
    });
  }
});

/**
 * GET /api/external/stats
 * Get error statistics across all external services
 */
router.get('/stats', (req, res) => {
  try {
    const stats = mockExternalAPI.getErrorStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;

