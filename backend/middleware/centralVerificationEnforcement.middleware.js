/**
 * Optional Central Verification Enforcement Middleware
 * Only enforces when society has enabled requireCentralVerification policy
 * Does NOT replace Aadhaar verification - acts as additional layer
 */

const CentralIdentity = require('../backend/models/CentralIdentity');
const Society = require('../backend/src/models/Society');
const Agent = require('../backend/src/models/Agent');

/**
 * Check if agent meets central verification requirements for their society
 * This is an OPTIONAL enforcement - only applies if society policy is enabled
 */
const checkCentralVerificationIfRequired = async (req, res, next) => {
  try {
    // Extract agent ID from request (adjust based on your auth structure)
    const agentId = req.user?.id || req.body?.agentId || req.params?.agentId;
    
    if (!agentId) {
      // No agent ID - skip check (let other middleware handle auth)
      return next();
    }

    // Get agent details
    const agent = await Agent.findById(agentId).populate('societyId');
    
    if (!agent || !agent.societyId) {
      // No agent or society - skip check
      return next();
    }

    // Check if society requires central verification
    const society = agent.societyId;
    
    if (!society.requireCentralVerification) {
      // Policy is OFF - skip enforcement, proceed normally
      console.log(`[Central Verification] Policy OFF for ${society.name} - skipping check`);
      return next();
    }

    // Policy is ON - check if agent has verified central identity
    console.log(`[Central Verification] Policy ON for ${society.name} - checking agent`);
    
    if (!agent.centralVerificationId) {
      return res.status(403).json({
        success: false,
        error: 'CENTRAL_VERIFICATION_REQUIRED',
        message: 'Your society requires central verification. Please complete verification first.',
        requiresAction: 'CENTRAL_VERIFICATION',
        policyEnabled: true
      });
    }

    // Check central identity status
    const centralIdentity = await CentralIdentity.findOne({ maid: agent.centralVerificationId });
    
    if (!centralIdentity) {
      return res.status(403).json({
        success: false,
        error: 'CENTRAL_VERIFICATION_INVALID',
        message: 'Central verification record not found. Please re-verify.',
        requiresAction: 'CENTRAL_VERIFICATION',
        policyEnabled: true
      });
    }

    if (centralIdentity.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'CENTRAL_VERIFICATION_PENDING',
        message: `Central verification status: ${centralIdentity.verificationStatus}. Access restricted until verified.`,
        requiresAction: 'WAIT_FOR_VERIFICATION',
        policyEnabled: true,
        currentStatus: centralIdentity.verificationStatus
      });
    }

    // All checks passed - agent is verified and policy is satisfied
    console.log(`[Central Verification] Agent ${agentId} passed verification check`);
    
    // Attach central identity info to request for downstream use
    req.centralIdentity = centralIdentity;
    req.societyPolicy = {
      requireCentralVerification: true
    };
    
    next();
    
  } catch (error) {
    console.error('[Central Verification] Middleware error:', error);
    
    // On error, fail open (don't block) but log the issue
    console.warn('[Central Verification] Enforcement skipped due to error - allowing request');
    next();
  }
};

/**
 * Check if a specific society requires central verification
 * Useful for registration/onboarding flows
 */
const getSocietyVerificationPolicy = async (societyId) => {
  try {
    const society = await Society.findOne({ 
      $or: [{ _id: societyId }, { societyId }] 
    });
    
    return {
      requireCentralVerification: society?.requireCentralVerification || false,
      societyName: society?.name || 'Unknown'
    };
  } catch (error) {
    console.error('[Policy Check] Error:', error);
    return {
      requireCentralVerification: false,
      error: error.message
    };
  }
};

/**
 * Informational middleware - adds policy info to response without blocking
 * Use this to inform clients about policy status without enforcing
 */
const attachPolicyInfo = async (req, res, next) => {
  try {
    const agentId = req.user?.id || req.body?.agentId || req.params?.agentId;
    
    if (!agentId) {
      return next();
    }

    const agent = await Agent.findById(agentId).populate('societyId');
    
    if (agent && agent.societyId) {
      req.societyPolicy = {
        requireCentralVerification: agent.societyId.requireCentralVerification || false,
        societyName: agent.societyId.name
      };
    }
    
    next();
  } catch (error) {
    console.error('[Policy Info] Error:', error);
    next();
  }
};

module.exports = {
  checkCentralVerificationIfRequired,
  getSocietyVerificationPolicy,
  attachPolicyInfo
};
