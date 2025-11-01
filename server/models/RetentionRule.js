const mongoose = require('mongoose');

const retentionRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  conditions: {
    severity: {
      type: [String],
      enum: ['low', 'medium', 'high', 'critical']
    },
    service: {
      type: [String]
    },
    errorType: {
      type: [String],
      enum: ['browser', 'server', 'database']
    }
  },
  retentionDays: {
    type: Number,
    min: 0
  },
  retentionDuration: {
    type: Number,
    min: 0,
    default: function () {
      return this.retentionDays || 0;
    }
  },
  retentionUnit: {
    type: String,
    enum: ['minutes', 'hours', 'days'],
    default: 'days'
  },
  autoArchive: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRunAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RetentionRule', retentionRuleSchema);
