const Tender = require('../models/Tender');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const embeddingService = require('../services/embeddingService');
const logger = require('../utils/logger');

/**
 * Get personalized tender recommendations for user
 */
const getTenderRecommendations = async (req, res) => {
  try {
    const { limit = 10, industries, excludeViewed = false } = req.query;
    const userId = req.user._id;

    // Get user profile and preferences
    const user = await User.findById(userId);
    
    // Build filter based on user preferences and parameters
    const filter = {
      status: 'active',
      submissionDeadline: { $gt: new Date() }
    };

    // Filter by industries if specified
    if (industries) {
      const industryArray = industries.split(',');
      filter.industry = { $in: industryArray };
    } else if (user.preferences?.preferredIndustries?.length > 0) {
      filter.industry = { $in: user.preferences.preferredIndustries };
    }

    // Exclude already viewed tenders if requested
    if (excludeViewed === 'true') {
      const viewedTenderIds = await Tender.find({
        'analytics.views.userId': userId
      }).distinct('_id');
      
      filter._id = { $nin: viewedTenderIds };
    }

    // Get user's skills and experience for matching
    const userSkills = user.profile?.skills || [];
    const userExperience = user.profile?.experience || [];

    // If user has skills/experience, try to find tenders that match
    let recommendedTenders = [];

    if (userSkills.length > 0) {
      // Use embeddings to find similar tenders based on user skills
      const skillsText = userSkills.join(' ') + ' ' + userExperience.map(exp => exp.title || '').join(' ');
      
      try {
        const skillsEmbedding = await embeddingService.generateEmbedding(skillsText);
        const similarTenders = await embeddingService.findSimilarTenders(
          skillsEmbedding,
          parseInt(limit),
          [],
          filter
        );
        recommendedTenders = similarTenders;
      } catch (embeddingError) {
        logger.warn('Failed to generate skill-based recommendations:', embeddingError);
        // Fall back to basic filtering
      }
    }

    // If no skill-based recommendations or not enough, get general recommendations
    if (recommendedTenders.length < parseInt(limit)) {
      const remainingLimit = parseInt(limit) - recommendedTenders.length;
      const excludeIds = recommendedTenders.map(t => t._id);
      
      const generalTenders = await Tender.find({
        ...filter,
        _id: { $nin: excludeIds }
      })
        .sort({ publishDate: -1, 'analytics.totalViews': -1 })
        .limit(remainingLimit)
        .populate('createdBy', 'name organizationName')
        .lean();

      recommendedTenders = [...recommendedTenders, ...generalTenders];
    }

    // Add recommendation reasons
    const tendersWithReasons = recommendedTenders.map(tender => ({
      ...tender,
      recommendationReason: getRecommendationReason(tender, user)
    }));

    res.json({
      success: true,
      data: {
        recommendations: tendersWithReasons,
        count: tendersWithReasons.length,
        basedOn: {
          skills: userSkills,
          industries: user.preferences?.preferredIndustries || [],
          experience: userExperience.length
        }
      }
    });

  } catch (error) {
    logger.error('Get tender recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tender recommendations'
    });
  }
};

/**
 * Get similar tenders based on a specific tender
 */
const getSimilarTenders = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Find similar tenders using embeddings
    const similarTenders = await embeddingService.findSimilarTenders(
      tender.embeddings,
      parseInt(limit),
      [id], // Exclude current tender
      { status: 'active' }
    );

    res.json({
      success: true,
      data: {
        baseTender: {
          id: tender._id,
          title: tender.title,
          industry: tender.industry
        },
        similarTenders,
        count: similarTenders.length
      }
    });

  } catch (error) {
    logger.error('Get similar tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar tenders'
    });
  }
};

/**
 * Get AI-powered content suggestions for proposal writing
 */
const getContentSuggestions = async (req, res) => {
  try {
    const { tenderId, section, currentContent, context } = req.body;

    if (!tenderId || !section) {
      return res.status(400).json({
        success: false,
        message: 'Tender ID and section are required'
      });
    }

    // Get tender details
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Get user profile for context
    const user = await User.findById(req.user._id);

    // Prepare context for AI suggestions
    const suggestionContext = {
      tender: {
        title: tender.title,
        description: tender.description,
        requirements: tender.requirements,
        industry: tender.industry,
        estimatedValue: tender.estimatedValue
      },
      user: {
        name: user.name,
        company: user.company,
        skills: user.profile?.skills || [],
        experience: user.profile?.experience || []
      },
      section,
      currentContent: currentContent || '',
      additionalContext: context || {}
    };

    // Get AI suggestions
    const suggestions = await geminiService.generateContentSuggestions(suggestionContext);

    res.json({
      success: true,
      data: {
        section,
        suggestions,
        confidence: suggestions.confidence || 0.8,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get content suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content suggestions'
    });
  }
};

/**
 * Get improvement recommendations for existing proposals
 */
const getProposalImprovements = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id)
      .populate('tenderId', 'title description requirements industry')
      .populate('createdBy', 'name company');

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

    // Analyze proposal and generate improvement suggestions
    const analysisContext = {
      proposal: {
        content: proposal.content,
        status: proposal.status
      },
      tender: {
        title: proposal.tenderId.title,
        description: proposal.tenderId.description,
        requirements: proposal.tenderId.requirements,
        industry: proposal.tenderId.industry
      }
    };

    const improvements = await geminiService.analyzeProposal(analysisContext);

    res.json({
      success: true,
      data: {
        proposalId: proposal._id,
        improvements,
        analysisDate: new Date()
      }
    });

  } catch (error) {
    logger.error('Get proposal improvements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate improvement recommendations'
    });
  }
};

/**
 * Get trending topics and keywords in the industry
 */
const getTrendingTopics = async (req, res) => {
  try {
    const { industry, timeframe = '30' } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build filter
    const filter = {
      publishDate: { $gte: startDate }
    };

    if (industry) {
      filter.industry = industry;
    }

    // Aggregate trending keywords from recent tenders
    const trendingData = await Tender.aggregate([
      { $match: filter },
      {
        $project: {
          title: 1,
          description: 1,
          requirements: 1,
          industry: 1,
          publishDate: 1
        }
      },
      {
        $addFields: {
          allText: {
            $concat: [
              '$title',
              ' ',
              '$description',
              ' ',
              { $reduce: {
                input: '$requirements',
                initialValue: '',
                in: { $concat: ['$$value', ' ', '$$this'] }
              }}
            ]
          }
        }
      }
    ]);

    // Extract keywords and trends (simplified implementation)
    const keywordFrequency = {};
    const industryTrends = {};

    trendingData.forEach(tender => {
      // Count industry trends
      industryTrends[tender.industry] = (industryTrends[tender.industry] || 0) + 1;

      // Extract keywords (simplified - in production, use NLP libraries)
      const words = tender.allText
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);

      words.forEach(word => {
        keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
      });
    });

    // Get top keywords
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    // Get top industries
    const topIndustries = Object.entries(industryTrends)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([industry, count]) => ({ industry, count }));

    res.json({
      success: true,
      data: {
        timeframe: `Last ${days} days`,
        totalTenders: trendingData.length,
        topKeywords,
        topIndustries,
        analyzedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get trending topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending topics'
    });
  }
};

/**
 * Get personalized writing tips based on user's proposal history
 */
const getWritingTips = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's proposal history
    const userProposals = await Proposal.find({ createdBy: userId })
      .populate('tenderId', 'industry')
      .limit(10)
      .sort({ createdAt: -1 });

    // Analyze patterns in user's proposals
    const analysisData = {
      totalProposals: userProposals.length,
      industries: [...new Set(userProposals.map(p => p.tenderId?.industry).filter(Boolean))],
      successRate: 0, // Calculate based on evaluation results
      commonSections: [],
      improvementAreas: []
    };

    // Calculate success rate
    const evaluatedProposals = userProposals.filter(p => p.evaluation?.status);
    const successfulProposals = userProposals.filter(p => p.evaluation?.status === 'accepted');
    
    if (evaluatedProposals.length > 0) {
      analysisData.successRate = (successfulProposals.length / evaluatedProposals.length) * 100;
    }

    // Generate personalized tips using AI
    const tips = await geminiService.generateWritingTips({
      userAnalysis: analysisData,
      recentProposals: userProposals.slice(0, 3).map(p => ({
        content: p.content,
        evaluation: p.evaluation
      }))
    });

    res.json({
      success: true,
      data: {
        userStats: analysisData,
        tips,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get writing tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate writing tips'
    });
  }
};

/**
 * Get competitive analysis for a tender
 */
const getCompetitiveAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const tender = await Tender.findById(id)
      .populate('proposals.submittedBy', 'name company');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Get similar past tenders for comparison
    const similarTenders = await embeddingService.findSimilarTenders(
      tender.embeddings,
      5,
      [id],
      { status: { $in: ['evaluation', 'awarded', 'closed'] } }
    );

    // Analyze competition metrics
    const analysis = {
      currentTender: {
        id: tender._id,
        title: tender.title,
        totalProposals: tender.proposals.length,
        estimatedValue: tender.estimatedValue,
        submissionDeadline: tender.submissionDeadline
      },
      competition: {
        totalBidders: tender.proposals.length,
        averageProposalsForSimilar: 0,
        competitionLevel: 'low', // low, medium, high
        estimatedWinProbability: 0
      },
      similarTenders: similarTenders.map(t => ({
        id: t._id,
        title: t.title,
        proposalCount: t.proposals?.length || 0,
        value: t.estimatedValue,
        similarity: t.similarity
      })),
      recommendations: []
    };

    // Calculate average proposals for similar tenders
    if (similarTenders.length > 0) {
      const totalProposals = similarTenders.reduce((sum, t) => sum + (t.proposals?.length || 0), 0);
      analysis.competition.averageProposalsForSimilar = totalProposals / similarTenders.length;
    }

    // Determine competition level
    const proposalCount = tender.proposals.length;
    if (proposalCount <= 3) {
      analysis.competition.competitionLevel = 'low';
      analysis.competition.estimatedWinProbability = 0.7;
    } else if (proposalCount <= 8) {
      analysis.competition.competitionLevel = 'medium';
      analysis.competition.estimatedWinProbability = 0.4;
    } else {
      analysis.competition.competitionLevel = 'high';
      analysis.competition.estimatedWinProbability = 0.2;
    }

    // Generate recommendations
    analysis.recommendations = [
      'Focus on unique value propositions to stand out',
      'Ensure competitive pricing while maintaining quality',
      'Highlight relevant experience and case studies',
      'Submit well before the deadline to avoid last-minute issues'
    ];

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Get competitive analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate competitive analysis'
    });
  }
};

/**
 * Helper function to determine recommendation reason
 */
const getRecommendationReason = (tender, user) => {
  const reasons = [];

  // Check industry match
  if (user.preferences?.preferredIndustries?.includes(tender.industry)) {
    reasons.push(`Matches your preferred industry: ${tender.industry}`);
  }

  // Check skills match
  const userSkills = user.profile?.skills || [];
  const tenderRequirements = tender.requirements || [];
  
  const matchingSkills = userSkills.filter(skill =>
    tenderRequirements.some(req => 
      req.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(req.toLowerCase())
    )
  );

  if (matchingSkills.length > 0) {
    reasons.push(`Matches your skills: ${matchingSkills.slice(0, 2).join(', ')}`);
  }

  // Check value range
  if (tender.estimatedValue && user.preferences?.budgetRange) {
    const { min, max } = user.preferences.budgetRange;
    if (tender.estimatedValue >= min && tender.estimatedValue <= max) {
      reasons.push('Within your preferred budget range');
    }
  }

  // Default reason
  if (reasons.length === 0) {
    reasons.push('Popular tender in your area of interest');
  }

  return reasons.join('; ');
};

module.exports = {
  getTenderRecommendations,
  getSimilarTenders,
  getContentSuggestions,
  getProposalImprovements,
  getTrendingTopics,
  getWritingTips,
  getCompetitiveAnalysis
};
