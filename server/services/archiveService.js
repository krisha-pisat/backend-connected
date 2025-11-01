const RetentionRule = require('../models/RetentionRule');
const ErrorLog = require('../models/ErrorLog');

/**
 * Service to handle automatic archiving of error logs based on retention rules
 */
const archiveService = {
  /**
   * Calculate retention duration in milliseconds
   */
  getRetentionDurationMs(ruleOrCriteria) {
    if (!ruleOrCriteria) {
      return 0;
    }

    const duration = ruleOrCriteria.retentionDuration !== undefined
      ? Number(ruleOrCriteria.retentionDuration)
      : Number(ruleOrCriteria.retentionDays);

    const unit = ruleOrCriteria.retentionUnit || (ruleOrCriteria.retentionDays !== undefined ? 'days' : 'minutes');

    if (isNaN(duration) || duration < 0) {
      return 0;
    }

    switch (unit) {
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      case 'days':
      default:
        return duration * 24 * 60 * 60 * 1000;
    }
  },

  /**
   * Archive logs based on retention rules
   */
  async archiveLogsByRules() {
    try {
      console.log('🔄 Starting auto-archival job...');
      
      const activeRules = await RetentionRule.find({
        isActive: true,
        autoArchive: true
      });

      let totalArchived = 0;

      for (const rule of activeRules) {
        const archived = await this.applyRule(rule);
        totalArchived += archived;

        // Update last run time
        rule.lastRunAt = new Date();
        await rule.save();
      }

      console.log(`✅ Auto-archival completed. Archived ${totalArchived} logs.`);
      return {
        success: true,
        rulesProcessed: activeRules.length,
        logsArchived: totalArchived
      };
    } catch (error) {
      console.error('❌ Auto-archival job failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Apply a specific retention rule to archive matching logs
   * @param {Object} rule - The retention rule to apply
   */
  async applyRule(rule) {
    const retentionMs = this.getRetentionDurationMs(rule);
    const cutoffDate = new Date(Date.now() - retentionMs);

    // Build match conditions
    const matchConditions = {
      isArchived: false,
      createdAt: { $lt: cutoffDate }
    };

    // Apply rule conditions
    if (rule.conditions.severity && rule.conditions.severity.length > 0) {
      matchConditions.severity = { $in: rule.conditions.severity };
    }

    if (rule.conditions.service && rule.conditions.service.length > 0) {
      matchConditions.service = { $in: rule.conditions.service };
    }

    if (rule.conditions.errorType && rule.conditions.errorType.length > 0) {
      matchConditions.errorType = { $in: rule.conditions.errorType };
    }

    // Archive matching logs
    const result = await ErrorLog.updateMany(
      matchConditions,
      {
        $set: {
          isArchived: true,
          archivedAt: new Date()
        }
      }
    );

    console.log(`📦 Rule "${rule.name}": Archived ${result.modifiedCount} logs`);
    return result.modifiedCount;
  },

  /**
   * Manually archive logs based on criteria
   * @param {Object} criteria - Archive criteria
   */
  async manualArchive(criteria) {
    try {
      const {
        retentionDuration,
        retentionUnit,
        retentionDays,
        severity,
        service,
        errorType
      } = criteria;

      if (retentionDuration === undefined && retentionDays === undefined) {
        throw new Error('retentionDuration (with unit) or retentionDays is required');
      }

      const retentionMs = this.getRetentionDurationMs({ retentionDuration, retentionUnit, retentionDays });
      const cutoffDate = new Date(Date.now() - retentionMs);

      const matchConditions = {
        isArchived: false,
        createdAt: { $lt: cutoffDate }
      };

      if (severity) {
        matchConditions.severity = severity;
      }

      if (service) {
        matchConditions.service = service;
      }

      if (errorType) {
        matchConditions.errorType = errorType;
      }

      const result = await ErrorLog.updateMany(
        matchConditions,
        {
          $set: {
            isArchived: true,
            archivedAt: new Date()
          }
        }
      );

      return {
        success: true,
        logsArchived: result.modifiedCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = archiveService;
