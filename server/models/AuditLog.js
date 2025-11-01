const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String
  },
  userId: {
    type: String,
    index: true
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  responseTime: {
    type: Number, // in milliseconds
    default: 0
  },
  projectId: {
    type: String,
    index: true,
    default: 'default'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ sessionId: 1, createdAt: -1 });
auditLogSchema.index({ projectId: 1, createdAt: -1 });
auditLogSchema.index({ endpoint: 1, createdAt: -1 });

// Static method to get stats by IP
auditLogSchema.statics.getStatsByIP = async function(ipAddress, timeRange = 24) {
  const hoursAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { ipAddress, createdAt: { $gte: hoursAgo } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
        endpoints: { $push: '$endpoint' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $project: {
        totalRequests: 1,
        uniqueSessions: { $size: '$uniqueSessions' },
        mostCalledEndpoint: {
          $arrayElemAt: [
            {
              $map: {
                input: { $slice: ['$endpoints', 10] },
                as: 'ep',
                in: '$$ep'
              }
            },
            0
          ]
        },
        avgResponseTime: { $round: ['$avgResponseTime', 2] }
      }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
