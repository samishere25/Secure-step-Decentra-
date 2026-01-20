const mongoose = require('mongoose');

const verificationHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    enum: ['created', 'verified', 'updated', 'flagged', 'cleared', 'risk_assessed'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'verificationHistory.performedByModel'
  },
  performedByModel: {
    type: String,
    enum: ['User', 'Agent', 'Admin']
  },
  details: {
    type: String
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: true });

const centralIdentitySchema = new mongoose.Schema({
  maid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'flagged', 'suspended', 'under_review'],
    default: 'pending',
    required: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
    required: true
  },
  trustLevel: {
    type: String,
    enum: ['unknown', 'low', 'medium', 'high', 'verified'],
    default: 'unknown',
    required: true
  },
  faceEmbeddingId: {
    type: String,
    trim: true
  },
  documentHash: {
    type: String,
    trim: true,
    index: true
  },
  deviceFingerprint: {
    type: String,
    trim: true
  },
  linkedAgentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  verificationHistory: [verificationHistorySchema],
  metadata: {
    lastVerificationDate: Date,
    totalVerifications: {
      type: Number,
      default: 0
    },
    flagCount: {
      type: Number,
      default: 0
    },
    lastRiskAssessment: Date
  }
}, {
  timestamps: true,
  collection: 'centralidentities'
});

// Indexes for performance
centralIdentitySchema.index({ verificationStatus: 1, riskScore: -1 });
centralIdentitySchema.index({ trustLevel: 1 });
centralIdentitySchema.index({ linkedAgentIds: 1 });

// Instance method to add verification history entry
centralIdentitySchema.methods.addVerificationEntry = function(action, performedBy, performedByModel, details, previousValue, newValue) {
  this.verificationHistory.push({
    action,
    performedBy,
    performedByModel,
    details,
    previousValue,
    newValue
  });
  return this.save();
};

// Instance method to update risk score
centralIdentitySchema.methods.updateRiskScore = function(newScore, performedBy, performedByModel) {
  const oldScore = this.riskScore;
  this.riskScore = newScore;
  this.metadata.lastRiskAssessment = new Date();
  
  this.verificationHistory.push({
    action: 'risk_assessed',
    performedBy,
    performedByModel,
    details: `Risk score updated from ${oldScore} to ${newScore}`,
    previousValue: oldScore,
    newValue: newScore
  });
  
  return this.save();
};

// Instance method to link agent
centralIdentitySchema.methods.linkAgent = function(agentId, performedBy, performedByModel) {
  if (!this.linkedAgentIds.includes(agentId)) {
    this.linkedAgentIds.push(agentId);
    this.verificationHistory.push({
      action: 'updated',
      performedBy,
      performedByModel,
      details: `Linked to agent: ${agentId}`,
      newValue: agentId
    });
  }
  return this.save();
};

// Static method to find by MAID
centralIdentitySchema.statics.findByMAID = function(maid) {
  return this.findOne({ maid: maid.toUpperCase() });
};

// Static method to find high-risk identities
centralIdentitySchema.statics.findHighRisk = function(threshold = 70) {
  return this.find({ riskScore: { $gte: threshold } }).sort({ riskScore: -1 });
};

// Pre-save middleware to update metadata
centralIdentitySchema.pre('save', function(next) {
  if (this.isModified('verificationStatus') && this.verificationStatus === 'verified') {
    this.metadata.lastVerificationDate = new Date();
    this.metadata.totalVerifications = (this.metadata.totalVerifications || 0) + 1;
  }
  
  if (this.isModified('verificationStatus') && this.verificationStatus === 'flagged') {
    this.metadata.flagCount = (this.metadata.flagCount || 0) + 1;
  }
  
  next();
});

const CentralIdentity = mongoose.model('CentralIdentity', centralIdentitySchema);

module.exports = CentralIdentity;
