const express = require('express');
const router = express.Router();
const errorMonitoringService = require('../services/errorMonitoringService');

/**
 * GET /api/monitoring/status
 * Get monitoring service status
 */
router.get('/status', (req, res) => {
  try {
    const status = errorMonitoringService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring status',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/start
 * Start automatic error monitoring
 */
router.post('/start', (req, res) => {
  try {
    errorMonitoringService.startMonitoring();
    res.json({
      success: true,
      message: 'Error monitoring service started',
      status: errorMonitoringService.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start monitoring',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/stop
 * Stop automatic error monitoring
 */
router.post('/stop', (req, res) => {
  try {
    errorMonitoringService.stopMonitoring();
    res.json({
      success: true,
      message: 'Error monitoring service stopped',
      status: errorMonitoringService.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop monitoring',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/trigger
 * Manually trigger a monitoring cycle
 */
router.post('/trigger', async (req, res) => {
  try {
    const result = await errorMonitoringService.triggerMonitoring();
    res.json({
      success: true,
      message: 'Monitoring cycle completed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger monitoring',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/service/:serviceName
 * Monitor a specific service
 */
router.post('/service/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const result = await errorMonitoringService.monitorService(serviceName);
    res.json({
      success: true,
      message: `Monitoring completed for ${serviceName}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to monitor service',
      error: error.message
    });
  }
});

module.exports = router;

