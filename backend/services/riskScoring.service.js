const CentralIdentity = require('../models/CentralIdentity');

/**
 * Risk Scoring Service
 * Calculates risk scores based on various identity and behavior factors
 * Does not modify any existing schemas except CentralIdentity
 */

/**
 * Weight configuration for risk calculation
 * Total should sum to 100 for percentage-based scoring
 */
const RISK_WEIGHTS = {
  verificationConfidence: 40,    // 40% - How confident we are in identity verification
  identityReuse: 25,              // 25% - How many times identity is reused
  deviceReuse: 20,                // 20% - How many times device is reused
  incidents: 15                   // 15% - Number of incidents/flags
};

/**
 * Thresholds for risk scoring
 */
const THRESHOLDS = {
  identityReuse: {
    low: 2,        // <= 2 uses is normal
    medium: 5,     // 3-5 uses is suspicious
    high: 10       // > 10 uses is high risk
  },
  deviceReuse: {
    low: 3,        // <= 3 devices is normal
    medium: 7,     // 4-7 devices is suspicious
    high: 15       // > 15 devices is high risk
  },
  incidents: {
    low: 0,        // 0 incidents
    medium: 2,     // 1-2 incidents
    high: 5        // > 5 incidents
  }
};

/**
 * Trust level mapping based on risk score
 */
const TRUST_LEVELS = {
  VERIFIED: { min: 0, max: 30, label: 'verified' },      // Low risk, highly trusted
  HIGH: { min: 31, max: 50, label: 'high' },             // Moderate-low risk
  MEDIUM: { min: 51, max: 70, label: 'medium' },         // Moderate-high risk
  LOW: { min: 71, max: 100, label: 'low' },              // High risk, low trust
  UNKNOWN: { min: -1, max: -1, label: 'unknown' }        // No data
};

/**
 * Calculate verification confidence risk component
 * Lower confidence = Higher risk
 * @param {number} verificationConfidence - Confidence level (0-1 or 0-100)
 * @returns {number} - Risk score component (0-100)
 */
function calculateVerificationRisk(verificationConfidence) {
  if (verificationConfidence === null || verificationConfidence === undefined) {
    return 50; // Default medium risk if no data
  }

  // Normalize to 0-1 range if provided as percentage
  const confidence = verificationConfidence > 1 ? verificationConfidence / 100 : verificationConfidence;
  
  // Invert: high confidence = low risk
  return Math.round((1 - confidence) * 100);
}

/**
 * Calculate identity reuse risk component
 * More reuse = Higher risk
 * @param {number} identityReuseCount - Number of times identity is linked to agents
 * @returns {number} - Risk score component (0-100)
 */
function calculateIdentityReuseRisk(identityReuseCount) {
  if (!identityReuseCount || identityReuseCount <= 0) {
    return 0; // No reuse = no risk
  }

  if (identityReuseCount <= THRESHOLDS.identityReuse.low) {
    return 10; // Low risk
  } else if (identityReuseCount <= THRESHOLDS.identityReuse.medium) {
    return 40; // Medium risk
  } else if (identityReuseCount <= THRESHOLDS.identityReuse.high) {
    return 70; // High risk
  } else {
    return 95; // Very high risk
  }
}

/**
 * Calculate device reuse risk component
 * More devices using same identity = Higher risk
 * @param {number} deviceReuseCount - Number of unique devices
 * @returns {number} - Risk score component (0-100)
 */
function calculateDeviceReuseRisk(deviceReuseCount) {
  if (!deviceReuseCount || deviceReuseCount <= 0) {
    return 0; // No data = no risk
  }

  if (deviceReuseCount <= THRESHOLDS.deviceReuse.low) {
    return 5; // Low risk
  } else if (deviceReuseCount <= THRESHOLDS.deviceReuse.medium) {
    return 35; // Medium risk
  } else if (deviceReuseCount <= THRESHOLDS.deviceReuse.high) {
    return 65; // High risk
  } else {
    return 90; // Very high risk
  }
}

/**
 * Calculate incident history risk component
 * More incidents = Higher risk
 * @param {number} incidentCount - Number of incidents/flags
 * @returns {number} - Risk score component (0-100)
 */
function calculateIncidentRisk(incidentCount) {
  if (!incidentCount || incidentCount <= 0) {
    return 0; // No incidents = no risk
  }

  if (incidentCount <= THRESHOLDS.incidents.medium) {
    return incidentCount * 20; // 20 per incident up to 2
  } else if (incidentCount <= THRESHOLDS.incidents.high) {
    return 40 + ((incidentCount - 2) * 15); // Add 15 per additional incident
  } else {
    return 95; // Very high risk for many incidents
  }
}

/**
 * Determine trust level based on risk score
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} - Trust level label
 */
function determineTrustLevel(riskScore) {
  if (riskScore >= TRUST_LEVELS.LOW.min && riskScore <= TRUST_LEVELS.LOW.max) {
    return TRUST_LEVELS.LOW.label;
  } else if (riskScore >= TRUST_LEVELS.MEDIUM.min && riskScore <= TRUST_LEVELS.MEDIUM.max) {
    return TRUST_LEVELS.MEDIUM.label;
  } else if (riskScore >= TRUST_LEVELS.HIGH.min && riskScore <= TRUST_LEVELS.HIGH.max) {
    return TRUST_LEVELS.HIGH.label;
  } else if (riskScore >= TRUST_LEVELS.VERIFIED.min && riskScore <= TRUST_LEVELS.VERIFIED.max) {
    return TRUST_LEVELS.VERIFIED.label;
  } else {
    return TRUST_LEVELS.UNKNOWN.label;
  }
}

/**
 * Calculate overall risk score using weighted components
 * @param {Object} params - Risk calculation parameters
 * @param {number} params.verificationConfidence - Confidence in identity verification (0-1 or 0-100)
 * @param {number} params.identityReuseCount - Number of times identity is reused
 * @param {number} params.deviceReuseCount - Number of unique devices used
 * @param {number} params.incidentCount - Number of incidents/flags
 * @returns {Object} - { riskScore, trustLevel, breakdown }
 */
function calculateRiskScore({
  verificationConfidence = 0.5,
  identityReuseCount = 0,
  deviceReuseCount = 0,
  incidentCount = 0
}) {
  // Calculate individual risk components
  const verificationRisk = calculateVerificationRisk(verificationConfidence);
  const identityRisk = calculateIdentityReuseRisk(identityReuseCount);
  const deviceRisk = calculateDeviceReuseRisk(deviceReuseCount);
  const incidentRisk = calculateIncidentRisk(incidentCount);

  // Apply weights to calculate overall risk score
  const weightedScore = (
    (verificationRisk * RISK_WEIGHTS.verificationConfidence) +
    (identityRisk * RISK_WEIGHTS.identityReuse) +
    (deviceRisk * RISK_WEIGHTS.deviceReuse) +
    (incidentRisk * RISK_WEIGHTS.incidents)
  ) / 100;

  // Ensure score is within 0-100 range
  const riskScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  // Determine trust level
  const trustLevel = determineTrustLevel(riskScore);

  // Return detailed breakdown
  return {
    riskScore,
    trustLevel,
    breakdown: {
      verificationRisk: {
        score: verificationRisk,
        weight: RISK_WEIGHTS.verificationConfidence,
        contribution: Math.round((verificationRisk * RISK_WEIGHTS.verificationConfidence) / 100)
      },
      identityReuseRisk: {
        score: identityRisk,
        weight: RISK_WEIGHTS.identityReuse,
        contribution: Math.round((identityRisk * RISK_WEIGHTS.identityReuse) / 100)
      },
      deviceReuseRisk: {
        score: deviceRisk,
        weight: RISK_WEIGHTS.deviceReuse,
        contribution: Math.round((deviceRisk * RISK_WEIGHTS.deviceReuse) / 100)
      },
      incidentRisk: {
        score: incidentRisk,
        weight: RISK_WEIGHTS.incidents,
        contribution: Math.round((incidentRisk * RISK_WEIGHTS.incidents) / 100)
      }
    },
    inputData: {
      verificationConfidence,
      identityReuseCount,
      deviceReuseCount,
      incidentCount
    }
  };
}

/**
 * Calculate and update risk score for a CentralIdentity
 * This is the only function that modifies CentralIdentity
 * @param {string} maid - Master Agent Identity
 * @param {Object} riskParams - Risk calculation parameters
 * @param {string} performedBy - ID of user performing action
 * @param {string} performedByModel - Model name ('User', 'Agent', 'Admin')
 * @returns {Object} - Updated identity with new risk score
 */
async function calculateAndUpdateRisk(maid, riskParams, performedBy, performedByModel = 'Admin') {
  try {
    // Find the identity
    const identity = await CentralIdentity.findByMAID(maid);
    
    if (!identity) {
      throw new Error(`Identity not found for MAID: ${maid}`);
    }

    // Calculate risk score
    const riskResult = calculateRiskScore(riskParams);

    // Update the identity using the model's method
    await identity.updateRiskScore(riskResult.riskScore, performedBy, performedByModel);

    // Update trust level
    identity.trustLevel = riskResult.trustLevel;
    await identity.save();

    return {
      identity,
      riskResult
    };
  } catch (error) {
    console.error('Error in calculateAndUpdateRisk:', error);
    throw error;
  }
}

/**
 * Get risk assessment for identity without updating database
 * @param {string} maid - Master Agent Identity
 * @returns {Object} - Risk assessment with current data
 */
async function assessIdentityRisk(maid) {
  try {
    const identity = await CentralIdentity.findByMAID(maid).populate('linkedAgentIds');
    
    if (!identity) {
      throw new Error(`Identity not found for MAID: ${maid}`);
    }

    // Calculate based on current identity data
    const riskParams = {
      verificationConfidence: identity.verificationStatus === 'verified' ? 0.9 : 0.5,
      identityReuseCount: identity.linkedAgentIds.length,
      deviceReuseCount: identity.deviceFingerprint ? 1 : 0, // Could be enhanced with device tracking
      incidentCount: identity.metadata.flagCount || 0
    };

    const riskResult = calculateRiskScore(riskParams);

    return {
      maid: identity.maid,
      currentRiskScore: identity.riskScore,
      currentTrustLevel: identity.trustLevel,
      calculatedRiskScore: riskResult.riskScore,
      calculatedTrustLevel: riskResult.trustLevel,
      breakdown: riskResult.breakdown,
      needsUpdate: identity.riskScore !== riskResult.riskScore,
      identity
    };
  } catch (error) {
    console.error('Error in assessIdentityRisk:', error);
    throw error;
  }
}

/**
 * Get risk level description
 * @param {number} riskScore - Risk score (0-100)
 * @returns {Object} - Risk level details
 */
function getRiskLevelDescription(riskScore) {
  const trustLevel = determineTrustLevel(riskScore);
  
  const descriptions = {
    'verified': {
      level: 'VERY LOW RISK',
      color: 'green',
      description: 'Identity is verified and highly trusted',
      recommendation: 'Approve access'
    },
    'high': {
      level: 'LOW RISK',
      color: 'lightgreen',
      description: 'Identity shows good trust indicators',
      recommendation: 'Approve with standard checks'
    },
    'medium': {
      level: 'MODERATE RISK',
      color: 'orange',
      description: 'Identity requires additional verification',
      recommendation: 'Manual review recommended'
    },
    'low': {
      level: 'HIGH RISK',
      color: 'red',
      description: 'Identity shows suspicious patterns',
      recommendation: 'Deny or escalate to admin'
    },
    'unknown': {
      level: 'UNKNOWN',
      color: 'gray',
      description: 'Insufficient data for risk assessment',
      recommendation: 'Collect more information'
    }
  };

  return {
    riskScore,
    trustLevel,
    ...descriptions[trustLevel]
  };
}

module.exports = {
  calculateRiskScore,
  calculateAndUpdateRisk,
  assessIdentityRisk,
  determineTrustLevel,
  getRiskLevelDescription,
  RISK_WEIGHTS,
  THRESHOLDS,
  TRUST_LEVELS
};
