const express = require('express');
const router = express.Router();
const CentralIdentity = require('../models/CentralIdentity');

/**
 * Central Status Routes
 * Routes for checking and monitoring central identity system status
 */

/**
 * @route   GET /api/central-status/health
 * @desc    Health check for central identity system
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check if CentralIdentity collection is accessible
    const count = await CentralIdentity.countDocuments();
    
    return res.status(200).json({
      success: true,
      status: 'operational',
      message: 'Central identity system is running',
      data: {
        totalIdentities: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in central status health check:', error);
    return res.status(503).json({
      success: false,
      status: 'unavailable',
      error: 'Central identity system unavailable',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/central-status/stats
 * @desc    Get statistics for central identity system
 * @access  Public/Protected
 */
router.get('/stats', async (req, res) => {
  try {
    const totalIdentities = await CentralIdentity.countDocuments();
    const verifiedIdentities = await CentralIdentity.countDocuments({ verificationStatus: 'verified' });
    const pendingIdentities = await CentralIdentity.countDocuments({ verificationStatus: 'pending' });
    const flaggedIdentities = await CentralIdentity.countDocuments({ verificationStatus: 'flagged' });
    const highRiskIdentities = await CentralIdentity.countDocuments({ riskScore: { $gte: 70 } });
    
    return res.status(200).json({
      success: true,
      data: {
        total: totalIdentities,
        verified: verifiedIdentities,
        pending: pendingIdentities,
        flagged: flaggedIdentities,
        highRisk: highRiskIdentities,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching central status stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/central-status/check/:maid
 * @desc    Quick status check for a specific MAID
 * @access  Public
 */
router.get('/check/:maid', async (req, res) => {
  try {
    const { maid } = req.params;
    
    if (!maid) {
      return res.status(400).json({
        success: false,
        error: 'MAID is required'
      });
    }
    
    const identity = await CentralIdentity.findByMAID(maid);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        exists: false,
        error: 'Identity not found',
        maid
      });
    }
    
    return res.status(200).json({
      success: true,
      exists: true,
      data: {
        maid: identity.maid,
        verificationStatus: identity.verificationStatus,
        trustLevel: identity.trustLevel,
        riskScore: identity.riskScore,
        isVerified: identity.verificationStatus === 'verified',
        lastUpdated: identity.updatedAt
      }
    });
  } catch (error) {
    console.error('Error checking MAID status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check MAID status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/central-status/:agentId
 * @desc    Get central verification status for an agent (READ-ONLY)
 * @access  Public
 */
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }
    
    // Find CentralIdentity where linkedAgentIds contains this agentId (READ-ONLY)
    const identity = await CentralIdentity.findOne({
      linkedAgentIds: agentId
    }).lean(); // Use lean() for read-only query
    
    if (!identity) {
      return res.status(200).json({
        success: true,
        centralVerified: false,
        message: 'No central identity found for this agent'
      });
    }
    
    return res.status(200).json({
      success: true,
      centralVerified: true,
      data: {
        maid: identity.maid,
        verificationStatus: identity.verificationStatus,
        riskScore: identity.riskScore,
        trustLevel: identity.trustLevel,
        isVerified: identity.verificationStatus === 'verified',
        lastUpdated: identity.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching central status for agent:', error);
    return res.status(500).json({
      success: false,
      centralVerified: false,
      error: 'Failed to fetch central verification status',
      message: error.message
    });
  }
});

module.exports = router;
