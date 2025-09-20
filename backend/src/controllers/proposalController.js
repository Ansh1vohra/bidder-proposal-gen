const Proposal = require('../models/Proposal');
const Tender = require('../models/Tender');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const embeddingService = require('../services/embeddingService');
const logger = require('../utils/logger');

/**
 * Generate AI proposal for a tender
 */
const generateProposal = async (req, res) => {
  try {
    const { tenderId, userRequirements, customSections } = req.body;

    // Validate input
    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Tender ID is required'
      });
    }

    // Find the tender
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is still accepting proposals
    if (tender.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This tender is no longer accepting proposals'
      });
    }

    if (new Date(tender.submissionDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed'
      });
    }

    // Check if user already has a proposal for this tender
    const existingProposal = await Proposal.findOne({
      tenderId,
      createdBy: req.user._id
    });

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: 'You already have a proposal for this tender',
        proposalId: existingProposal._id
      });
    }

    // Get user profile for context
    const userProfile = await User.findById(req.user._id);

    // Prepare context for AI generation
    const context = {
      tender: {
        title: tender.title,
        description: tender.description,
        requirements: tender.requirements,
        estimatedValue: tender.estimatedValue,
        industry: tender.industry,
        tenderType: tender.tenderType,
        submissionDeadline: tender.submissionDeadline
      },
      userProfile: {
        name: userProfile.name,
        company: userProfile.company,
        bio: userProfile.bio,
        experience: userProfile.profile?.experience,
        skills: userProfile.profile?.skills,
        pastProjects: userProfile.profile?.portfolio
      },
      userRequirements: userRequirements || {},
      customSections: customSections || []
    };

    // Generate proposal using Gemini AI
    const generatedContent = await geminiService.generateProposal(context);

    // Create proposal document
    const proposalData = {
      tenderId,
      createdBy: req.user._id,
      content: generatedContent.content,
      aiGeneration: {
        model: generatedContent.model,
        version: generatedContent.version,
        generatedAt: new Date(),
        confidence: generatedContent.confidence,
        processingTime: generatedContent.processingTime,
        inputTokens: generatedContent.inputTokens,
        outputTokens: generatedContent.outputTokens
      },
      userCustomization: {
        requirements: userRequirements,
        customSections: customSections || [],
        templates: []
      },
      status: 'draft'
    };

    const proposal = new Proposal(proposalData);

    // Generate embeddings for the proposal
    try {
      const proposalText = `${proposal.content.executiveSummary} ${proposal.content.solution?.description || ''}`;
      proposal.searchableText = proposalText;
      proposal.embeddings = await embeddingService.generateEmbedding(proposalText);
    } catch (embeddingError) {
      logger.warn('Failed to generate embeddings for proposal:', embeddingError);
    }

    await proposal.save();

    // Populate the created proposal
    await proposal.populate([
      { path: 'tenderId', select: 'title description submissionDeadline' },
      { path: 'createdBy', select: 'name email company' }
    ]);

    logger.info(`AI proposal generated for tender ${tender.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Proposal generated successfully',
      data: { proposal }
    });

  } catch (error) {
    logger.error('Generate proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate proposal'
    });
  }
};

/**
 * Get proposal by ID
 */
const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id)
      .populate('tenderId', 'title description submissionDeadline status')
      .populate('createdBy', 'name email company')
      .populate('collaboration.collaborators.user', 'name email');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check access permissions
    const canView = proposal.canUserView(req.user._id);
    if (!canView && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this proposal'
      });
    }

    // Add view analytics
    await proposal.addView(req.user._id);

    res.json({
      success: true,
      data: { proposal }
    });

  } catch (error) {
    logger.error('Get proposal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve proposal'
    });
  }
};

/**
 * Update proposal content
 */
const updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check edit permissions
    const canEdit = proposal.canUserEdit(req.user._id);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this proposal'
      });
    }

    // Cannot edit submitted proposals unless admin
    if (proposal.status === 'submitted' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit submitted proposals'
      });
    }

    // Track version before update
    const currentVersion = proposal.versionControl.currentVersion;
    
    // Create backup of current content before major updates
    if (updates.content) {
      proposal.versionControl.versions.push({
        version: currentVersion,
        content: { ...proposal.content },
        savedBy: req.user._id,
        savedAt: new Date(),
        comment: updates.versionComment || 'Content update'
      });
      
      proposal.versionControl.currentVersion = currentVersion + 1;
    }

    // Update proposal content
    if (updates.content) {
      Object.keys(updates.content).forEach(key => {
        proposal.content[key] = updates.content[key];
      });
    }

    // Track user edits
    proposal.userCustomization.edits.push({
      section: updates.editedSection || 'general',
      changes: updates.changes || 'Content updated',
      editedBy: req.user._id,
      editedAt: new Date()
    });

    // Update other fields
    const allowedUpdates = ['userCustomization', 'submission'];
    allowedUpdates.forEach(field => {
      if (updates[field]) {
        proposal[field] = { ...proposal[field], ...updates[field] };
      }
    });

    // Regenerate embeddings if content changed
    if (updates.content) {
      try {
        const proposalText = `${proposal.content.executiveSummary} ${proposal.content.solution?.description || ''}`;
        proposal.searchableText = proposalText;
        proposal.embeddings = await embeddingService.generateEmbedding(proposalText);
      } catch (embeddingError) {
        logger.warn('Failed to regenerate embeddings for proposal:', embeddingError);
      }
    }

    await proposal.save();

    await proposal.populate([
      { path: 'tenderId', select: 'title description submissionDeadline' },
      { path: 'createdBy', select: 'name email company' }
    ]);

    logger.info(`Proposal updated: ${proposal._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      data: { proposal }
    });

  } catch (error) {
    logger.error('Update proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal'
    });
  }
};

/**
 * Submit proposal
 */
const submitProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalReview, documents } = req.body;

    const proposal = await Proposal.findById(id).populate('tenderId');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this proposal'
      });
    }

    // Check if proposal is already submitted
    if (proposal.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is already submitted'
      });
    }

    // Check tender deadline
    if (new Date(proposal.tenderId.submissionDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed'
      });
    }

    // Validate required content
    const requiredSections = ['executiveSummary', 'solution'];
    const missingSections = requiredSections.filter(section => 
      !proposal.content[section] || !proposal.content[section].trim()
    );

    if (missingSections.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required sections',
        missingSections
      });
    }

    // Update submission details
    proposal.status = 'submitted';
    proposal.submission = {
      submittedAt: new Date(),
      submittedBy: req.user._id,
      finalReview: finalReview || 'Proposal submitted for consideration',
      documents: documents || [],
      confirmationNumber: `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    };

    await proposal.save();

    // Add proposal to tender
    await Tender.findByIdAndUpdate(proposal.tenderId._id, {
      $push: {
        proposals: {
          proposalId: proposal._id,
          submittedBy: req.user._id,
          submittedAt: new Date(),
          status: 'submitted'
        }
      }
    });

    logger.info(`Proposal submitted: ${proposal._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proposal submitted successfully',
      data: { 
        proposal,
        confirmationNumber: proposal.submission.confirmationNumber
      }
    });

  } catch (error) {
    logger.error('Submit proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit proposal'
    });
  }
};

/**
 * Get user's proposals
 */
const getMyProposals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tenderId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;
    if (tenderId) filter.tenderId = tenderId;

    const [proposals, total] = await Promise.all([
      Proposal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('tenderId', 'title description submissionDeadline status')
        .lean(),
      Proposal.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get my proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your proposals'
    });
  }
};

/**
 * Delete proposal
 */
const deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check ownership or admin rights
    if (proposal.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this proposal'
      });
    }

    // Cannot delete submitted proposals
    if (proposal.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submitted proposals'
      });
    }

    await Proposal.findByIdAndDelete(id);

    logger.info(`Proposal deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    logger.error('Delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal'
    });
  }
};

/**
 * Get similar proposals for recommendations
 */
const getSimilarProposals = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check view permissions
    const canView = proposal.canUserView(req.user._id);
    if (!canView && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this proposal'
      });
    }

    // Find similar proposals using embeddings
    const similarProposals = await embeddingService.findSimilarProposals(
      proposal.embeddings,
      parseInt(limit),
      [id] // Exclude current proposal
    );

    res.json({
      success: true,
      data: { similarProposals }
    });

  } catch (error) {
    logger.error('Get similar proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve similar proposals'
    });
  }
};

/**
 * Add collaborator to proposal
 */
const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permissions = ['view', 'comment'] } = req.body;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only proposal owner can add collaborators'
      });
    }

    // Find user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = proposal.collaboration.collaborators.find(
      collab => collab.user.toString() === userToAdd._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    // Add collaborator
    proposal.collaboration.collaborators.push({
      user: userToAdd._id,
      permissions,
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await proposal.save();

    logger.info(`Collaborator added to proposal ${id}: ${email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: { proposal }
    });

  } catch (error) {
    logger.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator'
    });
  }
};

/**
 * Export proposal to various formats
 */
const exportProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    const proposal = await Proposal.findById(id)
      .populate('tenderId', 'title description')
      .populate('createdBy', 'name email company');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check view permissions
    const canView = proposal.canUserView(req.user._id);
    if (!canView && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export this proposal'
      });
    }

    // For now, return the proposal data - actual export implementation would depend on requirements
    const exportData = {
      proposal: proposal.toJSON(),
      exportedAt: new Date(),
      exportedBy: req.user._id,
      format
    };

    res.json({
      success: true,
      message: `Proposal exported as ${format.toUpperCase()}`,
      data: exportData
    });

  } catch (error) {
    logger.error('Export proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export proposal'
    });
  }
};

module.exports = {
  generateProposal,
  getProposalById,
  updateProposal,
  submitProposal,
  getMyProposals,
  deleteProposal,
  getSimilarProposals,
  addCollaborator,
  exportProposal
};
