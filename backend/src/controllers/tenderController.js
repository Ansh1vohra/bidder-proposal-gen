const Tender = require('../models/Tender');
const User = require('../models/User');
const logger = require('../utils/logger');
const embeddingService = require('../services/embeddingService');

/**
 * Get all tenders with filtering, sorting, and pagination
 */
const getTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      industry,
      tenderType,
      location,
      minValue,
      maxValue,
      search,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (industry) filter.industry = industry;
    if (tenderType) filter.tenderType = tenderType;
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Value range filter
    if (minValue || maxValue) {
      filter.estimatedValue = {};
      if (minValue) filter.estimatedValue.$gte = parseFloat(minValue);
      if (maxValue) filter.estimatedValue.$lte = parseFloat(maxValue);
    }

    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } }
      ];
    }

    // Only show active tenders by default (unless user is admin)
    if (req.user?.role !== 'admin') {
      filter.status = { $in: ['active', 'evaluation'] };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [tenders, total] = await Promise.all([
      Tender.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email organizationName')
        .lean(),
      Tender.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        tenders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    logger.error('Get tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenders'
    });
  }
};

/**
 * Get tender by ID
 */
const getTenderById = async (req, res) => {
  try {
    const { id } = req.params;

    const tender = await Tender.findById(id)
      .populate('createdBy', 'name email organizationName')
      .populate('proposals.submittedBy', 'name email company');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Increment view count if user is authenticated
    if (req.user) {
      await tender.incrementViewCount(req.user._id);
    }

    res.json({
      success: true,
      data: { tender }
    });

  } catch (error) {
    logger.error('Get tender by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tender'
    });
  }
};

/**
 * Create new tender
 */
const createTender = async (req, res) => {
  try {
    const tenderData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'industry', 'tenderType', 'submissionDeadline'];
    const missingFields = requiredFields.filter(field => !tenderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate submission deadline
    if (new Date(tenderData.submissionDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline must be in the future'
      });
    }

    const tender = new Tender(tenderData);

    // Generate embeddings for the tender
    try {
      const tenderText = `${tender.title} ${tender.description} ${tender.requirements?.join(' ') || ''}`;
      tender.searchableText = tenderText;
      tender.embeddings = await embeddingService.generateEmbedding(tenderText);
    } catch (embeddingError) {
      logger.warn('Failed to generate embeddings for tender:', embeddingError);
      // Continue without embeddings
    }

    await tender.save();

    // Populate the created tender
    await tender.populate('createdBy', 'name email organizationName');

    logger.info(`Tender created: ${tender.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Tender created successfully',
      data: { tender }
    });

  } catch (error) {
    logger.error('Create tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tender'
    });
  }
};

/**
 * Update tender
 */
const updateTender = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check ownership or admin rights
    if (tender.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tender'
      });
    }

    // Prevent updating certain fields if tender has proposals
    if (tender.proposals.length > 0) {
      const restrictedFields = ['submissionDeadline', 'estimatedValue', 'requirements'];
      const hasRestrictedUpdates = restrictedFields.some(field => updates[field] !== undefined);
      
      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update submission deadline, estimated value, or requirements when tender has proposals'
        });
      }
    }

    // Update tender
    Object.keys(updates).forEach(key => {
      tender[key] = updates[key];
    });

    // Regenerate embeddings if content changed
    if (updates.title || updates.description || updates.requirements) {
      try {
        const tenderText = `${tender.title} ${tender.description} ${tender.requirements?.join(' ') || ''}`;
        tender.searchableText = tenderText;
        tender.embeddings = await embeddingService.generateEmbedding(tenderText);
      } catch (embeddingError) {
        logger.warn('Failed to regenerate embeddings for tender:', embeddingError);
      }
    }

    await tender.save();
    await tender.populate('createdBy', 'name email organizationName');

    logger.info(`Tender updated: ${tender.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender updated successfully',
      data: { tender }
    });

  } catch (error) {
    logger.error('Update tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tender'
    });
  }
};

/**
 * Delete tender
 */
const deleteTender = async (req, res) => {
  try {
    const { id } = req.params;

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check ownership or admin rights
    if (tender.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tender'
      });
    }

    // Check if tender has proposals
    if (tender.proposals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tender with existing proposals'
      });
    }

    await Tender.findByIdAndDelete(id);

    logger.info(`Tender deleted: ${tender.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender deleted successfully'
    });

  } catch (error) {
    logger.error('Delete tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tender'
    });
  }
};

/**
 * Get tender statistics
 */
const getTenderStats = async (req, res) => {
  try {
    const stats = await Tender.getTenderStatistics();

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    logger.error('Get tender stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tender statistics'
    });
  }
};

/**
 * Search tenders using embeddings
 */
const searchTenders = async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Generate embedding for search query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Find similar tenders
    const similarTenders = await embeddingService.findSimilarTenders(
      queryEmbedding,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        query,
        results: similarTenders
      }
    });

  } catch (error) {
    logger.error('Search tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tenders'
    });
  }
};

/**
 * Get tenders by industry
 */
const getTendersByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tenders, total] = await Promise.all([
      Tender.find({ 
        industry,
        status: { $in: ['active', 'evaluation'] }
      })
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email organizationName')
        .lean(),
      Tender.countDocuments({ 
        industry,
        status: { $in: ['active', 'evaluation'] }
      })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        industry,
        tenders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get tenders by industry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenders by industry'
    });
  }
};

/**
 * Get trending tenders (most viewed in last 7 days)
 */
const getTrendingTenders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tenders = await Tender.aggregate([
      {
        $match: {
          status: { $in: ['active', 'evaluation'] },
          publishDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $addFields: {
          recentViews: {
            $size: {
              $filter: {
                input: '$analytics.views',
                cond: { $gte: ['$$this.timestamp', sevenDaysAgo] }
              }
            }
          }
        }
      },
      {
        $sort: { recentViews: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
          pipeline: [
            { $project: { name: 1, email: 1, organizationName: 1 } }
          ]
        }
      },
      {
        $unwind: '$createdBy'
      }
    ]);

    res.json({
      success: true,
      data: { tenders }
    });

  } catch (error) {
    logger.error('Get trending tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending tenders'
    });
  }
};

/**
 * Get user's created tenders
 */
const getMyTenders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;

    const [tenders, total] = await Promise.all([
      Tender.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('proposals.submittedBy', 'name email company')
        .lean(),
      Tender.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        tenders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get my tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your tenders'
    });
  }
};

/**
 * Update tender status
 */
const updateTenderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check ownership or admin rights
    if (tender.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tender status'
      });
    }

    const oldStatus = tender.status;
    tender.status = status;

    // Add status change to history
    tender.statusHistory.push({
      status,
      changedBy: req.user._id,
      reason: reason || `Status changed from ${oldStatus} to ${status}`
    });

    await tender.save();

    logger.info(`Tender status updated: ${tender.title} from ${oldStatus} to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender status updated successfully',
      data: { tender }
    });

  } catch (error) {
    logger.error('Update tender status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tender status'
    });
  }
};

module.exports = {
  getTenders,
  getTenderById,
  createTender,
  updateTender,
  deleteTender,
  getTenderStats,
  searchTenders,
  getTendersByIndustry,
  getTrendingTenders,
  getMyTenders,
  updateTenderStatus
};
