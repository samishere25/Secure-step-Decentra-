const CentralIdentity = require('../models/CentralIdentity');

/**
 * Central Verification Middleware
 * Validates that an identity is verified before allowing access to protected routes
 * Read-only middleware - does not modify any schemas except optional logging
 */

/**
 * Check if MAID is verified in CentralIdentity collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function requireVerifiedIdentity(req, res, next) {
  try {
    // Extract MAID from multiple possible sources
    const maid = req.headers['x-maid'] || 
                 req.headers['maid'] || 
                 req.body?.maid || 
                 req.query?.maid ||
                 req.params?.maid;

    // Check if MAID is provided
    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required',
        message: 'Please provide MAID in header (x-maid), body, query, or params'
      });
    }

    // Fetch identity from CentralIdentity collection
    const identity = await CentralIdentity.findByMAID(maid);

    // Check if identity exists
    if (!identity) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `No identity found for MAID: ${maid}`
      });
    }

    // Check verification status
    if (identity.verificationStatus !== 'verified') {
      // Optional: Log blocked access attempt (read-only logging)
      console.warn(`[VERIFICATION BLOCKED] MAID: ${maid}, Status: ${identity.verificationStatus}, Route: ${req.path}`);
      
      return res.status(403).json({
        success: false,
        error: 'Identity not verified',
        message: `Access denied. Identity verification status: ${identity.verificationStatus}`,
        data: {
          maid: identity.maid,
          currentStatus: identity.verificationStatus,
          requiredStatus: 'verified',
          trustLevel: identity.trustLevel,
          riskScore: identity.riskScore
        }
      });
    }

    // Attach identity to request for downstream use
    req.centralIdentity = identity;
    req.maid = maid;

    // Log successful verification (optional)
    console.log(`[VERIFICATION PASSED] MAID: ${maid}, Route: ${req.path}`);

    // Allow request to proceed
    next();

  } catch (error) {
    console.error('[VERIFICATION ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Verification check failed',
      message: error.message
    });
  }
}

/**
 * Check if identity has acceptable risk level
 * @param {number} maxRiskScore - Maximum acceptable risk score (default: 70)
 * @returns {Function} Express middleware function
 */
function requireLowRisk(maxRiskScore = 70) {
  return async (req, res, next) => {
    try {
      // Extract MAID
      const maid = req.maid || 
                   req.headers['x-maid'] || 
                   req.headers['maid'] || 
                   req.body?.maid || 
                   req.query?.maid ||
                   req.params?.maid;

      if (!maid) {
        return res.status(400).json({
          success: false,
          error: 'MAID is required for risk check'
        });
      }

      // Fetch identity
      const identity = await CentralIdentity.findByMAID(maid);

      if (!identity) {
        return res.status(404).json({
          success: false,
          error: 'Identity not found'
        });
      }

      // Check risk score
      if (identity.riskScore > maxRiskScore) {
        console.warn(`[HIGH RISK BLOCKED] MAID: ${maid}, Risk: ${identity.riskScore}/${maxRiskScore}, Route: ${req.path}`);
        
        return res.status(403).json({
          success: false,
          error: 'Risk score too high',
          message: `Access denied. Identity risk score ${identity.riskScore} exceeds maximum ${maxRiskScore}`,
          data: {
            maid: identity.maid,
            riskScore: identity.riskScore,
            maxAllowed: maxRiskScore,
            trustLevel: identity.trustLevel
          }
        });
      }

      // Attach identity if not already attached
      if (!req.centralIdentity) {
        req.centralIdentity = identity;
        req.maid = maid;
      }

      console.log(`[RISK CHECK PASSED] MAID: ${maid}, Risk: ${identity.riskScore}/${maxRiskScore}`);

      next();

    } catch (error) {
      console.error('[RISK CHECK ERROR]', error);
      return res.status(500).json({
        success: false,
        error: 'Risk check failed',
        message: error.message
      });
    }
  };
}

/**
 * Check if identity has minimum trust level
 * @param {string} minTrustLevel - Minimum required trust level ('verified', 'high', 'medium', 'low')
 * @returns {Function} Express middleware function
 */
function requireTrustLevel(minTrustLevel = 'medium') {
  // Trust level hierarchy (higher index = more trusted)
  const trustHierarchy = ['unknown', 'low', 'medium', 'high', 'verified'];
  const minIndex = trustHierarchy.indexOf(minTrustLevel);

  if (minIndex === -1) {
    throw new Error(`Invalid trust level: ${minTrustLevel}`);
  }

  return async (req, res, next) => {
    try {
      // Extract MAID
      const maid = req.maid || 
                   req.headers['x-maid'] || 
                   req.headers['maid'] || 
                   req.body?.maid || 
                   req.query?.maid ||
                   req.params?.maid;

      if (!maid) {
        return res.status(400).json({
          success: false,
          error: 'MAID is required for trust level check'
        });
      }

      // Fetch identity
      const identity = await CentralIdentity.findByMAID(maid);

      if (!identity) {
        return res.status(404).json({
          success: false,
          error: 'Identity not found'
        });
      }

      // Check trust level
      const currentIndex = trustHierarchy.indexOf(identity.trustLevel);
      
      if (currentIndex < minIndex) {
        console.warn(`[LOW TRUST BLOCKED] MAID: ${maid}, Trust: ${identity.trustLevel} < ${minTrustLevel}, Route: ${req.path}`);
        
        return res.status(403).json({
          success: false,
          error: 'Trust level too low',
          message: `Access denied. Identity trust level '${identity.trustLevel}' is below required '${minTrustLevel}'`,
          data: {
            maid: identity.maid,
            currentTrustLevel: identity.trustLevel,
            requiredTrustLevel: minTrustLevel,
            riskScore: identity.riskScore
          }
        });
      }

      // Attach identity if not already attached
      if (!req.centralIdentity) {
        req.centralIdentity = identity;
        req.maid = maid;
      }

      console.log(`[TRUST CHECK PASSED] MAID: ${maid}, Trust: ${identity.trustLevel} >= ${minTrustLevel}`);

      next();

    } catch (error) {
      console.error('[TRUST CHECK ERROR]', error);
      return res.status(500).json({
        success: false,
        error: 'Trust level check failed',
        message: error.message
      });
    }
  };
}

/**
 * Optional middleware to check identity without blocking
 * Attaches identity to request but allows unverified access
 * Useful for logging/analytics without blocking
 */
async function checkIdentityOptional(req, res, next) {
  try {
    // Extract MAID
    const maid = req.headers['x-maid'] || 
                 req.headers['maid'] || 
                 req.body?.maid || 
                 req.query?.maid ||
                 req.params?.maid;

    if (!maid) {
      // No MAID provided, continue without identity
      return next();
    }

    // Fetch identity
    const identity = await CentralIdentity.findByMAID(maid);

    if (identity) {
      // Attach identity to request
      req.centralIdentity = identity;
      req.maid = maid;
      console.log(`[IDENTITY FOUND] MAID: ${maid}, Status: ${identity.verificationStatus}, Risk: ${identity.riskScore}`);
    } else {
      console.log(`[IDENTITY NOT FOUND] MAID: ${maid}`);
    }

    // Always proceed
    next();

  } catch (error) {
    console.error('[IDENTITY CHECK ERROR]', error);
    // Log error but don't block request
    next();
  }
}

/**
 * Combined middleware for full verification check
 * Checks: verified status + low risk + high trust
 */
const requireFullVerification = [
  requireVerifiedIdentity,
  requireLowRisk(70),
  requireTrustLevel('high')
];

module.exports = {
  requireVerifiedIdentity,
  requireLowRisk,
  requireTrustLevel,
  checkIdentityOptional,
  requireFullVerification
};
