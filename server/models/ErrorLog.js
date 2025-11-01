const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  errorType: {
    type: String,
    enum: ['browser', 'server', 'database'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stackTrace: {
    type: String
  },
  userAgent: {
    type: String
  },
  url: {
    type: String
  },
  userId: {
    type: String
  },
  ipAddress: {
    type: String,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date
  },
  archivedTime: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ severity: 1, createdAt: -1 });
errorLogSchema.index({ service: 1, createdAt: -1 });
errorLogSchema.index({ errorType: 1, createdAt: -1 });
errorLogSchema.index({ isArchived: 1, createdAt: -1 });

// Virtual for checking if error is repeated (same message in last hour)
errorLogSchema.methods.isRepeated = async function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await mongoose.model('ErrorLog').countDocuments({
    message: this.message,
    service: this.service,
    severity: this.severity,
    createdAt: { $gte: oneHourAgo },
    _id: { $ne: this._id }
  });
  return count > 0;
};

module.exports = mongoose.model('ErrorLog', errorLogSchema);
