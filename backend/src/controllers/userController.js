const User = require('../models/User');
const Proposal = require('../models/Proposal');
const Tender = require('../models/Tender');
const logger = require('../utils/logger');

/**
 * Get user profile by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can view this profile
    if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      // Return limited public profile
      const publicProfile = {
        _id: user._id,
        name: user.name,
        company: user.company,
        bio: user.bio,
        profile: {
          skills: user.profile?.skills || [],
          experience: user.profile?.experience || [],
          portfolio: user.profile?.portfolio || []
        },
        createdAt: user.createdAt
      };

      return res.json({
        success: true,
        data: { user: publicProfile }
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = req.user;

    // Fields that can be updated
    const allowedUpdates = [
      'name', 'phone', 'company', 'bio', 'profile', 
      'preferences', 'notifications'
    ];

    // Filter out non-allowed updates
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Special handling for nested profile fields
    if (updates.profile) {
      const currentProfile = user.profile || {};
      filteredUpdates.profile = { ...currentProfile, ...updates.profile };
    }

    // Update user
    Object.keys(filteredUpdates).forEach(key => {
      user[key] = filteredUpdates[key];
    });

    await user.save();

    // Return updated user without sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;

    logger.info(`Profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Get user dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's proposals and tenders statistics
    const [
      totalProposals,
      submittedProposals,
      draftProposals,
      totalTenders,
      activeTenders,
      recentActivity
    ] = await Promise.all([
      Proposal.countDocuments({ createdBy: userId }),
      Proposal.countDocuments({ createdBy: userId, status: 'submitted' }),
      Proposal.countDocuments({ createdBy: userId, status: 'draft' }),
      Tender.countDocuments({ createdBy: userId }),
      Tender.countDocuments({ createdBy: userId, status: 'active' }),
      Proposal.find({ createdBy: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('tenderId', 'title status')
        .select('status updatedAt tenderId')
    ]);

    // Calculate success rate
    const evaluatedProposals = await Proposal.countDocuments({ 
      createdBy: userId, 
      'evaluation.status': { $in: ['accepted', 'rejected'] }
    });

    const acceptedProposals = await Proposal.countDocuments({ 
      createdBy: userId, 
      'evaluation.status': 'accepted'
    });

    const successRate = evaluatedProposals > 0 ? (acceptedProposals / evaluatedProposals) * 100 : 0;

    const stats = {
      proposals: {
        total: totalProposals,
        submitted: submittedProposals,
        draft: draftProposals,
        successRate: Math.round(successRate * 100) / 100
      },
      tenders: {
        total: totalTenders,
        active: activeTenders
      },
      recentActivity
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics'
    });
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

/**
 * Update user status (admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;

    // Add to status history
    user.statusHistory.push({
      status: isActive ? 'active' : 'deactivated',
      changedBy: req.user._id,
      reason: reason || `Status changed from ${oldStatus ? 'active' : 'deactivated'} to ${isActive ? 'active' : 'deactivated'}`,
      changedAt: new Date()
    });

    await user.save();

    logger.info(`User status updated: ${user.email} - ${isActive ? 'activated' : 'deactivated'} by ${req.user.email}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: user.toJSON() }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot change own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const oldRole = user.role;
    user.role = role;

    // Update permissions based on role
    if (role === 'admin') {
      user.permissions = [
        'read_all_tenders', 'create_tender', 'edit_tender', 'delete_tender',
        'read_all_proposals', 'edit_proposal', 'evaluate_proposal',
        'manage_users', 'view_analytics', 'export_data'
      ];
    } else {
      user.permissions = ['create_proposal', 'edit_own_proposal', 'view_public_tenders'];
    }

    // Add to role history
    user.roleHistory.push({
      role,
      changedBy: req.user._id,
      reason: reason || `Role changed from ${oldRole} to ${role}`,
      changedAt: new Date()
    });

    await user.save();

    logger.info(`User role updated: ${user.email} from ${oldRole} to ${role} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: user.toJSON() }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

/**
 * Get user activity history
 */
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user can view this activity
    if (id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user activity'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's recent activities
    const [proposals, tenders] = await Promise.all([
      Proposal.find({ createdBy: id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('tenderId', 'title')
        .select('status updatedAt tenderId createdAt')
        .lean(),
      Tender.find({ createdBy: id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('title status updatedAt createdAt')
        .lean()
    ]);

    // Combine and sort activities
    const activities = [
      ...proposals.map(p => ({
        type: 'proposal',
        id: p._id,
        title: p.tenderId?.title || 'Unknown Tender',
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      ...tenders.map(t => ({
        type: 'tender',
        id: t._id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      data: { activities }
    });

  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity'
    });
  }
};

/**
 * Delete user account
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferData, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user'
      });
    }

    // Cannot delete admin users unless by another admin
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Check for active submissions
    const activeProposals = await Proposal.countDocuments({
      createdBy: id,
      status: 'submitted'
    });

    const activeTenders = await Tender.countDocuments({
      createdBy: id,
      status: 'active'
    });

    if (activeProposals > 0 || activeTenders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active proposals or tenders',
        details: {
          activeProposals,
          activeTenders
        }
      });
    }

    // Delete user data or transfer to another user
    if (transferData && transferData.newOwnerId) {
      // Transfer ownership of tenders and proposals
      await Promise.all([
        Tender.updateMany(
          { createdBy: id },
          { createdBy: transferData.newOwnerId }
        ),
        Proposal.updateMany(
          { createdBy: id },
          { createdBy: transferData.newOwnerId }
        )
      ]);
    } else {
      // Delete user data
      await Promise.all([
        Tender.deleteMany({ createdBy: id }),
        Proposal.deleteMany({ createdBy: id })
      ]);
    }

    // Delete user
    await User.findByIdAndDelete(id);

    logger.info(`User deleted: ${user.email} by ${req.user.email}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

/**
 * Search users
 */
const searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .select('name email company bio profile.skills')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

module.exports = {
  getUserById,
  updateProfile,
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getUserActivity,
  deleteUser,
  searchUsers
};
