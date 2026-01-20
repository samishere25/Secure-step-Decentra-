/**
 * Central Verification Policy Routes
 * Admin-configurable toggle for optional enforcement
 */

const express = require('express');
const router = express.Router();
const Society = require('../models/Society');
const { protect, authorize } = require('../middleware/auth.middleware');

// Helper middleware for admin-only routes
const requireAdmin = authorize('admin', 'super_admin');

/**
 * GET /api/policy/central-verification/:societyId
 * Get central verification policy for a society
 */
router.get('/central-verification/:societyId', protect, async (req, res) => {
  try {
    const society = await Society.findOne({ societyId: req.params.societyId });
    
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    res.json({
      success: true,
      data: {
        societyId: society.societyId,
        societyName: society.name,
        requireCentralVerification: society.requireCentralVerification || false,
        description: 'When enabled, agents must complete central verification (does not replace Aadhaar verification)'
      }
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy'
    });
  }
});

/**
 * PUT /api/policy/central-verification/:societyId
 * Update central verification policy (Admin only)
 */
router.put('/central-verification/:societyId', protect, requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: enabled must be a boolean'
      });
    }

    const society = await Society.updateCentralVerificationPolicy(
      req.params.societyId,
      enabled
    );

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    res.json({
      success: true,
      message: `Central verification policy ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        societyId: society.societyId,
        societyName: society.name,
        requireCentralVerification: society.requireCentralVerification,
        updatedAt: society.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update policy'
    });
  }
});

/**
 * GET /api/policy/central-verification
 * Get all societies with their central verification policies (Admin only)
 */
router.get('/central-verification', protect, requireAdmin, async (req, res) => {
  try {
    const societies = await Society.find({}, {
      societyId: 1,
      name: 1,
      requireCentralVerification: 1,
      isActive: 1
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: societies.length,
      data: societies.map(s => ({
        societyId: s.societyId,
        name: s.name,
        requireCentralVerification: s.requireCentralVerification || false,
        isActive: s.isActive
      }))
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies'
    });
  }
});

/**
 * GET /api/policy/my-society
 * Check if current user's society requires central verification (Agent use)
 */
router.get('/my-society', protect, async (req, res) => {
  try {
    const Agent = require('../models/Agent');
    const agent = await Agent.findById(req.user.id).populate('societyId');
    
    if (!agent || !agent.societyId) {
      return res.json({
        success: true,
        data: {
          requireCentralVerification: false,
          message: 'No society assigned'
        }
      });
    }

    res.json({
      success: true,
      data: {
        societyId: agent.societyId.societyId,
        societyName: agent.societyId.name,
        requireCentralVerification: agent.societyId.requireCentralVerification || false,
        hasCentralVerification: !!agent.centralVerificationId,
        message: agent.societyId.requireCentralVerification 
          ? 'Your society requires central verification'
          : 'Central verification is optional for your society'
      }
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy'
    });
  }
});

module.exports = router;
