const express = require('express');
const router = express.Router();
const identityResolutionService = require('../services/identityResolution.service');
const riskScoringService = require('../services/riskScoring.service');

/**
 * Pre-Verification Routes
 * Independent route file that only interacts with CentralIdentity collection
 * Does not modify Agent, User, Visit, SOS, or Incident collections
 */

/**
 * @route   POST /api/preverify/start
 * @desc    Start pre-verification process for an identity
 * @access  Public/Protected (add auth middleware as needed)
 * @body    {
 *            documentHash: string (required),
 *            faceEmbeddingId: string (optional),
 *            deviceFingerprint: string (optional),
 *            agentId: string (optional),
 *            performedBy: string (optional),
 *            performedByModel: string (optional)
 *          }
 * @returns {
 *            success: boolean,
 *            data: {
 *              maid: string,
 *              verificationStatus: string,
 *              riskScore: number,
 *              trustLevel: string,
 *              isNewIdentity: boolean,
 *              matchedOn: array,
 *              matchConfidence: number,
 *              riskBreakdown: object
 *            }
 *          }
 */
router.post('/start', async (req, res) => {
  try {
    const {
      documentHash,
      faceEmbeddingId,
      deviceFingerprint,
      agentId,
      performedBy,
      performedByModel = 'Agent'
    } = req.body;

    // Validation
    if (!documentHash && !faceEmbeddingId && !deviceFingerprint) {
      return res.status(400).json({
        success: false,
        error: 'At least one identifier is required (documentHash, faceEmbeddingId, or deviceFingerprint)'
      });
    }

    // Step 1: Resolve identity (find existing or create new)
    const identityResult = await identityResolutionService.resolveIdentity({
      documentHash,
      faceEmbeddingId,
      deviceFingerprint,
      agentId,
      performedBy,
      performedByModel
    });

    // Step 2: Calculate risk score
    const riskParams = {
      verificationConfidence: identityResult.matchConfidence || 0.5,
      identityReuseCount: identityResult.identity.linkedAgentIds.length,
      deviceReuseCount: deviceFingerprint ? 1 : 0,
      incidentCount: identityResult.identity.metadata.flagCount || 0
    };

    const riskResult = riskScoringService.calculateRiskScore(riskParams);

    // Step 3: Update the CentralIdentity with calculated risk
    await riskScoringService.calculateAndUpdateRisk(
      identityResult.maid,
      riskParams,
      performedBy,
      performedByModel
    );

    // Step 4: Return comprehensive response
    return res.status(identityResult.isNewIdentity ? 201 : 200).json({
      success: true,
      message: identityResult.message,
      data: {
        maid: identityResult.maid,
        verificationStatus: identityResult.identity.verificationStatus,
        riskScore: riskResult.riskScore,
        trustLevel: riskResult.trustLevel,
        isNewIdentity: identityResult.isNewIdentity,
        matchedOn: identityResult.matchedOn,
        matchConfidence: identityResult.matchConfidence,
        riskBreakdown: riskResult.breakdown,
        linkedAgentCount: identityResult.identity.linkedAgentIds.length,
        createdAt: identityResult.identity.createdAt,
        updatedAt: identityResult.identity.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in pre-verification start:', error);
    
    // Handle specific error types
    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message,
        details: 'One or more required fields are missing'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        message: error.message,
        validationErrors: error.errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate identity',
        message: 'An identity with this information already exists'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to complete pre-verification',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/preverify/status/:maid
 * @desc    Get current verification status for a MAID
 * @access  Public/Protected
 * @returns Current identity status including risk assessment
 */
router.get('/status/:maid', async (req, res) => {
  try {
    const { maid } = req.params;

    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }

    // Get identity
    const identity = await identityResolutionService.findIdentityByMAID(maid);

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        maid
      });
    }

    // Get current risk assessment
    const riskAssessment = await riskScoringService.assessIdentityRisk(maid);

    return res.status(200).json({
      success: true,
      data: {
        maid: identity.maid,
        verificationStatus: identity.verificationStatus,
        riskScore: identity.riskScore,
        trustLevel: identity.trustLevel,
        linkedAgentCount: identity.linkedAgentIds.length,
        faceEmbeddingId: identity.faceEmbeddingId,
        documentHash: identity.documentHash ? '***' + identity.documentHash.slice(-8) : null,
        deviceFingerprint: identity.deviceFingerprint ? '***' + identity.deviceFingerprint.slice(-8) : null,
        metadata: identity.metadata,
        riskAssessment: {
          current: riskAssessment.currentRiskScore,
          calculated: riskAssessment.calculatedRiskScore,
          needsUpdate: riskAssessment.needsUpdate,
          breakdown: riskAssessment.breakdown
        },
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching verification status:', error);
    
    if (error.message.includes('not found') || error.message.includes('Identity not found')) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `No identity exists for the provided MAID`,
        maid: req.params.maid
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch verification status',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/preverify/risk/:maid
 * @desc    Get detailed risk breakdown for a MAID
 * @access  Public/Protected
 * @returns Detailed risk scoring information
 */
router.get('/risk/:maid', async (req, res) => {
  try {
    const { maid } = req.params;

    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }

    // Get risk assessment
    const riskAssessment = await riskScoringService.assessIdentityRisk(maid);
    const riskDescription = riskScoringService.getRiskLevelDescription(riskAssessment.calculatedRiskScore);

    return res.status(200).json({
      success: true,
      data: {
        maid,
        riskScore: riskAssessment.calculatedRiskScore,
        trustLevel: riskAssessment.calculatedTrustLevel,
        riskDescription,
        breakdown: riskAssessment.breakdown,
        needsUpdate: riskAssessment.needsUpdate
      }
    });

  } catch (error) {
    console.error('Error fetching risk details:', error);
    
    if (error.message.includes('not found') || error.message.includes('Identity not found')) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `Cannot calculate risk for non-existent identity`,
        maid: req.params.maid
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch risk details',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   PUT /api/preverify/update-status/:maid
 * @desc    Update verification status for a MAID
 * @access  Protected (should require admin/agent auth)
 * @body    { status: string, performedBy: string, performedByModel: string }
 * @returns Updated identity
 */
router.put('/update-status/:maid', async (req, res) => {
  try {
    const { maid } = req.params;
    const { status, performedBy, performedByModel = 'Admin' } = req.body;

    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'verified', 'rejected', 'flagged', 'suspended', 'under_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update status
    const updatedIdentity = await identityResolutionService.updateVerificationStatus(
      maid,
      status,
      performedBy,
      performedByModel
    );

    return res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: {
        maid: updatedIdentity.maid,
        verificationStatus: updatedIdentity.verificationStatus,
        riskScore: updatedIdentity.riskScore,
        trustLevel: updatedIdentity.trustLevel,
        updatedAt: updatedIdentity.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating verification status:', error);
    
    if (error.message.includes('not found') || error.message.includes('Identity not found')) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `Cannot update status for non-existent identity`,
        maid: req.params.maid
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value',
        message: error.message,
        allowedValues: ['pending', 'verified', 'rejected', 'flagged', 'suspended', 'under_review']
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update verification status',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   PUT /api/preverify/update-risk/:maid
 * @desc    Manually update risk score for a MAID
 * @access  Protected (should require admin auth)
 * @body    { riskScore: number, performedBy: string, performedByModel: string }
 * @returns Updated identity with new risk score
 */
router.put('/update-risk/:maid', async (req, res) => {
  try {
    const { maid } = req.params;
    const { riskScore, performedBy, performedByModel = 'Admin' } = req.body;

    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }

    if (riskScore === undefined || riskScore === null) {
      return res.status(400).json({
        success: false,
        error: 'Risk score is required'
      });
    }

    if (riskScore < 0 || riskScore > 100) {
      return res.status(400).json({
        success: false,
        error: 'Risk score must be between 0 and 100'
      });
    }

    // Update risk score
    const updatedIdentity = await riskScoringService.calculateAndUpdateRisk(
      maid,
      { verificationConfidence: (100 - riskScore) / 100 },
      performedBy,
      performedByModel
    );

    return res.status(200).json({
      success: true,
      message: 'Risk score updated successfully',
      data: {
        maid: updatedIdentity.identity.maid,
        riskScore: updatedIdentity.identity.riskScore,
        trustLevel: updatedIdentity.identity.trustLevel,
        verificationStatus: updatedIdentity.identity.verificationStatus,
        updatedAt: updatedIdentity.identity.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating risk score:', error);
    
    if (error.message.includes('not found') || error.message.includes('Identity not found')) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `Cannot update risk score for non-existent identity`,
        maid: req.params.maid
      });
    }
    
    if (error.name === 'ValidationError' || error.message.includes('must be between')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid risk score',
        message: 'Risk score must be a number between 0 and 100',
        providedValue: req.body.riskScore
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update risk score',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/preverify/history/:maid
 * @desc    Get verification history for a MAID
 * @access  Protected
 * @returns Complete verification history
 */
router.get('/history/:maid', async (req, res) => {
  try {
    const { maid } = req.params;

    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }

    const identity = await identityResolutionService.findIdentityByMAID(maid);

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        maid
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        maid: identity.maid,
        verificationHistory: identity.verificationHistory,
        totalEntries: identity.verificationHistory.length
      }
    });

  } catch (error) {
    console.error('Error fetching verification history:', error);
    
    if (error.message.includes('not found') || error.message.includes('Identity not found')) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found',
        message: `No verification history available for this MAID`,
        maid: req.params.maid
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch verification history',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/preverify/high-risk
 * @desc    Get all high-risk identities
 * @access  Protected (admin only)
 * @query   threshold (optional, default: 70)
 * @returns List of high-risk identities
 */
router.get('/high-risk', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 70;

    if (threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        error: 'Threshold must be between 0 and 100'
      });
    }

    const highRiskIdentities = await identityResolutionService.getHighRiskIdentities(threshold);

    return res.status(200).json({
      success: true,
      data: {
        threshold,
        count: highRiskIdentities.length,
        identities: highRiskIdentities.map(identity => ({
          maid: identity.maid,
          riskScore: identity.riskScore,
          trustLevel: identity.trustLevel,
          verificationStatus: identity.verificationStatus,
          linkedAgentCount: identity.linkedAgentIds.length,
          flagCount: identity.metadata.flagCount,
          createdAt: identity.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching high-risk identities:', error);
    
    if (error.message.includes('threshold')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid threshold value',
        message: 'Threshold must be a number between 0 and 100',
        providedValue: req.query.threshold
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch high-risk identities',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/preverify/search
 * @desc    Search identities with filters
 * @access  Protected
 * @body    { verificationStatus, trustLevel, minRiskScore, maxRiskScore, maid, limit }
 * @returns Filtered list of identities
 */
router.post('/search', async (req, res) => {
  try {
    const filters = req.body;

    const identities = await identityResolutionService.searchIdentities(filters);

    return res.status(200).json({
      success: true,
      data: {
        count: identities.length,
        filters: filters,
        identities: identities.map(identity => ({
          maid: identity.maid,
          verificationStatus: identity.verificationStatus,
          riskScore: identity.riskScore,
          trustLevel: identity.trustLevel,
          linkedAgentCount: identity.linkedAgentIds.length,
          metadata: identity.metadata,
          createdAt: identity.createdAt,
          updatedAt: identity.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error searching identities:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        message: error.message,
        providedFilters: req.body
      });
    }
    
    if (error.message.includes('timeout') || error.message.includes('Too many')) {
      return res.status(429).json({
        success: false,
        error: 'Search query too broad',
        message: 'Please refine your search criteria or reduce the limit',
        suggestion: 'Add more specific filters to narrow results'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to search identities',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
