const CentralIdentity = require('../models/CentralIdentity');
const crypto = require('crypto');

/**
 * Generate a unique MAID (Master Agent Identity)
 * Format: MAID-YYYYMMDD-XXXX (where XXXX is random alphanumeric)
 */
function generateMAID() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MAID-${dateStr}-${randomStr}`;
}

/**
 * Calculate similarity score between two embeddings or hashes
 * Returns a score between 0 (no match) and 1 (perfect match)
 */
function calculateSimilarity(value1, value2) {
  if (!value1 || !value2) return 0;
  if (value1 === value2) return 1;
  
  // Simple string similarity for demonstration
  // In production, use proper face embedding comparison algorithms
  const maxLength = Math.max(value1.length, value2.length);
  let matches = 0;
  for (let i = 0; i < Math.min(value1.length, value2.length); i++) {
    if (value1[i] === value2[i]) matches++;
  }
  return matches / maxLength;
}

/**
 * Resolve identity by searching for matches in CentralIdentity collection
 * @param {Object} params - Identity parameters
 * @param {string} params.documentHash - Hash of identity document
 * @param {string} params.faceEmbeddingId - Face embedding identifier
 * @param {string} params.deviceFingerprint - Device fingerprint
 * @param {string} params.agentId - Optional agent ID to link (ObjectId)
 * @param {string} params.performedBy - Optional ID of user performing action
 * @param {string} params.performedByModel - Optional model name ('User', 'Agent', 'Admin')
 * @returns {Object} - { maid, isNewIdentity, matchedOn, identity, matchConfidence }
 */
async function resolveIdentity({
  documentHash,
  faceEmbeddingId,
  deviceFingerprint,
  agentId = null,
  performedBy = null,
  performedByModel = 'Agent'
}) {
  try {
    // Validation
    if (!documentHash && !faceEmbeddingId && !deviceFingerprint) {
      throw new Error('At least one identifier (documentHash, faceEmbeddingId, or deviceFingerprint) is required');
    }

    // Build search query for potential matches
    const searchConditions = [];
    
    if (documentHash) {
      searchConditions.push({ documentHash });
    }
    
    if (deviceFingerprint) {
      searchConditions.push({ deviceFingerprint });
    }
    
    if (faceEmbeddingId) {
      searchConditions.push({ faceEmbeddingId });
    }

    // Search for existing identity
    let existingIdentity = null;
    let matchedOn = [];
    let matchConfidence = 0;

    if (searchConditions.length > 0) {
      // Find any matching identity
      existingIdentity = await CentralIdentity.findOne({
        $or: searchConditions
      }).populate('linkedAgentIds');

      if (existingIdentity) {
        // Determine what matched
        if (documentHash && existingIdentity.documentHash === documentHash) {
          matchedOn.push('documentHash');
          matchConfidence = Math.max(matchConfidence, 0.9);
        }
        
        if (deviceFingerprint && existingIdentity.deviceFingerprint === deviceFingerprint) {
          matchedOn.push('deviceFingerprint');
          matchConfidence = Math.max(matchConfidence, 0.7);
        }
        
        if (faceEmbeddingId && existingIdentity.faceEmbeddingId === faceEmbeddingId) {
          matchedOn.push('faceEmbeddingId');
          matchConfidence = Math.max(matchConfidence, 0.85);
        }

        // Link agent if provided and not already linked
        if (agentId && !existingIdentity.linkedAgentIds.some(id => id.toString() === agentId.toString())) {
          existingIdentity.linkedAgentIds.push(agentId);
          existingIdentity.verificationHistory.push({
            action: 'updated',
            performedBy,
            performedByModel,
            details: `Linked to agent: ${agentId}`,
            newValue: agentId
          });
          await existingIdentity.save();
        }

        return {
          maid: existingIdentity.maid,
          isNewIdentity: false,
          matchedOn,
          matchConfidence,
          identity: existingIdentity,
          message: `Existing identity found. Matched on: ${matchedOn.join(', ')}`
        };
      }
    }

    // No match found - create new identity
    const newMAID = generateMAID();
    
    const newIdentity = new CentralIdentity({
      maid: newMAID,
      documentHash,
      faceEmbeddingId,
      deviceFingerprint,
      linkedAgentIds: agentId ? [agentId] : [],
      verificationStatus: 'pending',
      riskScore: 50,
      trustLevel: 'unknown',
      verificationHistory: [{
        action: 'created',
        performedBy,
        performedByModel,
        details: 'New identity created',
        newValue: {
          documentHash,
          faceEmbeddingId,
          deviceFingerprint
        }
      }]
    });

    await newIdentity.save();

    return {
      maid: newMAID,
      isNewIdentity: true,
      matchedOn: [],
      matchConfidence: 0,
      identity: newIdentity,
      message: 'New identity created successfully'
    };

  } catch (error) {
    console.error('Error in resolveIdentity:', error);
    throw error;
  }
}

/**
 * Find identity by MAID
 * @param {string} maid - Master Agent Identity
 * @returns {Object} - CentralIdentity document or null
 */
async function findIdentityByMAID(maid) {
  try {
    return await CentralIdentity.findByMAID(maid).populate('linkedAgentIds');
  } catch (error) {
    console.error('Error in findIdentityByMAID:', error);
    throw error;
  }
}

/**
 * Update identity verification status
 * @param {string} maid - Master Agent Identity
 * @param {string} status - New verification status
 * @param {string} performedBy - ID of user performing action
 * @param {string} performedByModel - Model name ('User', 'Agent', 'Admin')
 * @returns {Object} - Updated identity
 */
async function updateVerificationStatus(maid, status, performedBy, performedByModel = 'Admin') {
  try {
    const identity = await CentralIdentity.findByMAID(maid);
    
    if (!identity) {
      throw new Error(`Identity not found for MAID: ${maid}`);
    }

    const previousStatus = identity.verificationStatus;
    identity.verificationStatus = status;
    
    identity.verificationHistory.push({
      action: status === 'verified' ? 'verified' : status === 'flagged' ? 'flagged' : 'updated',
      performedBy,
      performedByModel,
      details: `Verification status changed from ${previousStatus} to ${status}`,
      previousValue: previousStatus,
      newValue: status
    });

    await identity.save();

    return identity;
  } catch (error) {
    console.error('Error in updateVerificationStatus:', error);
    throw error;
  }
}

/**
 * Update risk score for an identity
 * @param {string} maid - Master Agent Identity
 * @param {number} riskScore - New risk score (0-100)
 * @param {string} performedBy - ID of user performing action
 * @param {string} performedByModel - Model name
 * @returns {Object} - Updated identity
 */
async function updateRiskScore(maid, riskScore, performedBy, performedByModel = 'Admin') {
  try {
    const identity = await CentralIdentity.findByMAID(maid);
    
    if (!identity) {
      throw new Error(`Identity not found for MAID: ${maid}`);
    }

    // Update risk score using model's instance method (this saves the document)
    await identity.updateRiskScore(riskScore, performedBy, performedByModel);

    // Update trust level based on risk score
    if (riskScore >= 80) {
      identity.trustLevel = 'low';
    } else if (riskScore >= 60) {
      identity.trustLevel = 'medium';
    } else if (riskScore >= 40) {
      identity.trustLevel = 'high';
    } else {
      identity.trustLevel = 'verified';
    }

    // Save again to persist trust level changes
    await identity.save();

    return identity;
  } catch (error) {
    console.error('Error in updateRiskScore:', error);
    throw error;
  }
}

/**
 * Get all identities linked to an agent
 * @param {string} agentId - Agent ObjectId
 * @returns {Array} - Array of CentralIdentity documents
 */
async function getIdentitiesByAgent(agentId) {
  try {
    return await CentralIdentity.find({
      linkedAgentIds: agentId
    }).populate('linkedAgentIds');
  } catch (error) {
    console.error('Error in getIdentitiesByAgent:', error);
    throw error;
  }
}

/**
 * Get high-risk identities
 * @param {number} threshold - Risk score threshold (default 70)
 * @returns {Array} - Array of high-risk identities
 */
async function getHighRiskIdentities(threshold = 70) {
  try {
    return await CentralIdentity.findHighRisk(threshold).populate('linkedAgentIds');
  } catch (error) {
    console.error('Error in getHighRiskIdentities:', error);
    throw error;
  }
}

/**
 * Search identities with filters
 * @param {Object} filters - Search filters
 * @returns {Array} - Array of matching identities
 */
async function searchIdentities(filters = {}) {
  try {
    const query = {};

    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.trustLevel) {
      query.trustLevel = filters.trustLevel;
    }

    if (filters.minRiskScore !== undefined) {
      query.riskScore = { $gte: filters.minRiskScore };
    }

    if (filters.maxRiskScore !== undefined) {
      query.riskScore = { ...query.riskScore, $lte: filters.maxRiskScore };
    }

    if (filters.maid) {
      query.maid = filters.maid.toUpperCase();
    }

    return await CentralIdentity.find(query)
      .populate('linkedAgentIds')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
  } catch (error) {
    console.error('Error in searchIdentities:', error);
    throw error;
  }
}

module.exports = {
  resolveIdentity,
  findIdentityByMAID,
  updateVerificationStatus,
  updateRiskScore,
  getIdentitiesByAgent,
  getHighRiskIdentities,
  searchIdentities,
  generateMAID
};
