const express = require('express');
const router = express.Router();
const RetentionRule = require('../models/RetentionRule');

const normalizeRetentionInput = ({ retentionDuration, retentionUnit, retentionDays }) => {
  let duration = retentionDuration;
  let unit = retentionUnit;

  if (duration === undefined && retentionDays !== undefined) {
    duration = retentionDays;
    unit = 'days';
  }

  if (duration === undefined) {
    return null;
  }

  duration = Number(duration);
  if (isNaN(duration) || duration < 0) {
    return null;
  }

  unit = unit || 'days';
  if (!['minutes', 'hours', 'days'].includes(unit)) {
    unit = 'days';
  }

  const durationInDays = unit === 'minutes'
    ? duration / (60 * 24)
    : unit === 'hours'
      ? duration / 24
      : duration;

  return {
    retentionDuration: duration,
    retentionUnit: unit,
    retentionDays: durationInDays
  };
};

/**
 * GET /api/rules
 * View a list of all configured rules
 */
router.get('/', async (req, res) => {
  try {
    const rules = await RetentionRule.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retention rules',
      error: error.message
    });
  }
});

/**
 * POST /api/rules
 * Create a new retention or archival rule
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      conditions,
      retentionDuration,
      retentionUnit,
      retentionDays,
      autoArchive = false
    } = req.body;

    const normalized = normalizeRetentionInput({ retentionDuration, retentionUnit, retentionDays });

    // Validation
    if (!name || !normalized) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid retention configuration: provide retentionDuration (and unit) or retentionDays'
      });
    }

    // Check if rule with same name exists
    const existingRule = await RetentionRule.findOne({ name });
    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: 'Rule with this name already exists'
      });
    }

    const rule = new RetentionRule({
      name,
      description,
      conditions: conditions || {},
      retentionDuration: normalized.retentionDuration,
      retentionUnit: normalized.retentionUnit,
      retentionDays: normalized.retentionDays,
      autoArchive,
      isActive: true
    });

    await rule.save();

    res.status(201).json({
      success: true,
      message: 'Retention rule created successfully',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create retention rule',
      error: error.message
    });
  }
});

/**
 * PUT /api/rules/:id
 * Edit an existing archival rule
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      conditions,
      retentionDuration,
      retentionUnit,
      retentionDays,
      autoArchive,
      isActive
    } = req.body;

    const rule = await RetentionRule.findById(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Retention rule not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== rule.name) {
      const existingRule = await RetentionRule.findOne({ name });
      if (existingRule) {
        return res.status(400).json({
          success: false,
          message: 'Rule with this name already exists'
        });
      }
      rule.name = name;
    }

    if (description !== undefined) rule.description = description;
    if (conditions !== undefined) rule.conditions = conditions;

    if (retentionDuration !== undefined || retentionDays !== undefined) {
      const normalized = normalizeRetentionInput({ retentionDuration, retentionUnit, retentionDays });
      if (!normalized) {
        return res.status(400).json({
          success: false,
          message: 'Invalid retention configuration'
        });
      }
      rule.retentionDuration = normalized.retentionDuration;
      rule.retentionUnit = normalized.retentionUnit;
      rule.retentionDays = normalized.retentionDays;
    }

    if (autoArchive !== undefined) rule.autoArchive = autoArchive;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    res.json({
      success: true,
      message: 'Retention rule updated successfully',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update retention rule',
      error: error.message
    });
  }
});

/**
 * DELETE /api/rules/:id
 * Delete a retention rule
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await RetentionRule.findByIdAndDelete(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Retention rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Retention rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete retention rule',
      error: error.message
    });
  }
});

/**
 * PATCH /api/rules/:id/archive-toggle
 * Enable or disable auto-archival for a specific rule
 */
router.patch('/:id/archive-toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { autoArchive } = req.body;

    if (typeof autoArchive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoArchive must be a boolean value'
      });
    }

    const rule = await RetentionRule.findById(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Retention rule not found'
      });
    }

    rule.autoArchive = autoArchive;
    await rule.save();

    res.json({
      success: true,
      message: `Auto-archival ${autoArchive ? 'enabled' : 'disabled'} for rule`,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle auto-archival',
      error: error.message
    });
  }
});

module.exports = router;
