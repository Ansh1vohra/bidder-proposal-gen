const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.isConfigured = false;
    
    if (!this.apiKey || this.apiKey === 'your-gemini-api-key-here') {
      logger.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
      this.genAI = null;
      this.model = null;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: process.env.GEMINI_MODEL || 'gemini-pro' 
        });
        this.isConfigured = true;
        logger.info('Gemini AI service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Gemini AI service:', error);
        this.genAI = null;
        this.model = null;
      }
    }
  }

  _checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Gemini AI service is not configured. Please set GEMINI_API_KEY environment variable.');
    }
  }

  /**
   * Generate a proposal for a tender using Gemini AI
   * @param {Object} tenderData - The tender information
   * @param {Object} companyProfile - Company profile information
   * @param {string} customRequirements - Additional requirements
   * @returns {Promise<Object>} Generated proposal
   */
  async generateProposal(tenderData, companyProfile, customRequirements = '') {
    this._checkConfiguration();
    
    try {
      const prompt = this.buildProposalPrompt(tenderData, companyProfile, customRequirements);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const proposalText = response.text();

      // Parse the response to extract structured data
      const proposal = this.parseProposalResponse(proposalText);
      
      logger.info('Proposal generated successfully with Gemini');
      
      return {
        success: true,
        proposal: proposal,
        aiConfidence: this.calculateConfidence(proposalText),
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_MODEL || 'gemini-pro'
      };
    } catch (error) {
      logger.error('Error generating proposal with Gemini:', error);
      throw new Error('Failed to generate proposal: ' + error.message);
    }
  }

  /**
   * Generate tender recommendations based on user profile
   * @param {Object} userProfile - User profile and preferences
   * @param {Array} availableTenders - List of available tenders
   * @returns {Promise<Array>} Recommended tenders
   */
  async generateTenderRecommendations(userProfile, availableTenders) {
    this._checkConfiguration();
    
    try {
      const prompt = this.buildRecommendationPrompt(userProfile, availableTenders);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendationText = response.text();

      const recommendations = this.parseRecommendations(recommendationText);
      
      logger.info('Tender recommendations generated successfully');
      
      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations with Gemini:', error);
      throw new Error('Failed to generate recommendations: ' + error.message);
    }
  }

  /**
   * Analyze tender requirements and extract key information
   * @param {string} tenderDescription - Tender description text
   * @returns {Promise<Object>} Analyzed requirements
   */
  async analyzeTenderRequirements(tenderDescription) {
    this._checkConfiguration();
    
    try {
      const prompt = `
        Analyze the following tender description and extract key information:
        
        "${tenderDescription}"
        
        Please provide a structured analysis in JSON format with:
        1. Key requirements (array)
        2. Budget estimate (if mentioned)
        3. Timeline/deadline information
        4. Required qualifications/certifications
        5. Project category/type
        6. Location/geographical scope
        7. Complexity level (1-10)
        8. Key technologies/skills needed
        
        Return only valid JSON without any markdown formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      try {
        const analysis = JSON.parse(analysisText);
        return analysis;
      } catch (parseError) {
        // If JSON parsing fails, return a structured fallback
        return {
          keyRequirements: [tenderDescription.substring(0, 200) + '...'],
          budgetEstimate: 'Not specified',
          timeline: 'Not specified',
          qualifications: [],
          category: 'General',
          location: 'Not specified',
          complexity: 5,
          technologies: []
        };
      }
    } catch (error) {
      logger.error('Error analyzing tender requirements:', error);
      throw new Error('Failed to analyze tender requirements: ' + error.message);
    }
  }

  /**
   * Generate embeddings for similarity matching (simple approach)
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array>} Simple text embeddings
   */
  async generateEmbeddings(text) {
    try {
      // For simple embeddings, we'll use a basic approach
      // In a more sophisticated implementation, you could use Gemini's text embedding models
      const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
      const wordFreq = {};
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      // Create a simple vector based on word frequencies
      const commonWords = Object.keys(wordFreq)
        .sort((a, b) => wordFreq[b] - wordFreq[a])
        .slice(0, 100); // Top 100 words

      const embedding = new Array(100).fill(0);
      commonWords.forEach((word, index) => {
        embedding[index] = wordFreq[word] / words.length;
      });

      return embedding;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings: ' + error.message);
    }
  }

  /**
   * Build prompt for proposal generation
   * @private
   */
  buildProposalPrompt(tenderData, companyProfile, customRequirements) {
    return `
      Generate a professional tender proposal based on the following information:

      TENDER DETAILS:
      Title: ${tenderData.title}
      Description: ${tenderData.description}
      Category: ${tenderData.category}
      Budget: ${tenderData.budget || 'Not specified'}
      Deadline: ${tenderData.deadline}
      Requirements: ${tenderData.requirements?.join(', ') || 'Not specified'}
      Location: ${tenderData.location}

      COMPANY PROFILE:
      Name: ${companyProfile.name}
      Experience: ${companyProfile.experience || 'Not specified'}
      Specializations: ${companyProfile.specializations?.join(', ') || 'Not specified'}
      Previous Projects: ${companyProfile.previousProjects || 'Not specified'}
      Certifications: ${companyProfile.certifications?.join(', ') || 'Not specified'}

      CUSTOM REQUIREMENTS:
      ${customRequirements}

      Please generate a comprehensive proposal that includes:
      1. Executive Summary
      2. Understanding of Requirements
      3. Proposed Solution/Approach
      4. Timeline
      5. Budget Breakdown
      6. Company Qualifications
      7. Risk Management
      8. Quality Assurance

      Format the response as a structured JSON object with these sections.
    `;
  }

  /**
   * Build prompt for recommendations
   * @private
   */
  buildRecommendationPrompt(userProfile, availableTenders) {
    return `
      Based on the user profile and available tenders, recommend the most suitable tenders:

      USER PROFILE:
      Specializations: ${userProfile.specializations?.join(', ') || 'Not specified'}
      Experience Level: ${userProfile.experienceLevel || 'Not specified'}
      Budget Range: ${userProfile.budgetRange || 'Not specified'}
      Preferred Locations: ${userProfile.preferredLocations?.join(', ') || 'Not specified'}
      Previous Success Categories: ${userProfile.successCategories?.join(', ') || 'Not specified'}

      AVAILABLE TENDERS:
      ${availableTenders.slice(0, 20).map(tender => 
        `ID: ${tender.id}, Title: ${tender.title}, Category: ${tender.category}, Budget: ${tender.budget}, Location: ${tender.location}`
      ).join('\n')}

      Analyze the match between user profile and each tender, then return the top 10 recommendations 
      with match scores (0-100) and reasoning. Format as JSON array.
    `;
  }

  /**
   * Parse proposal response from Gemini
   * @private
   */
  parseProposalResponse(proposalText) {
    try {
      // Try to parse as JSON first
      const jsonMatch = proposalText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured object from text
      return {
        executiveSummary: this.extractSection(proposalText, 'executive summary'),
        requirements: this.extractSection(proposalText, 'requirements'),
        solution: this.extractSection(proposalText, 'solution'),
        timeline: this.extractSection(proposalText, 'timeline'),
        budget: this.extractSection(proposalText, 'budget'),
        qualifications: this.extractSection(proposalText, 'qualifications'),
        riskManagement: this.extractSection(proposalText, 'risk'),
        qualityAssurance: this.extractSection(proposalText, 'quality'),
        fullText: proposalText
      };
    } catch (error) {
      logger.warn('Failed to parse proposal response, returning raw text');
      return { fullText: proposalText };
    }
  }

  /**
   * Parse recommendations from Gemini response
   * @private
   */
  parseRecommendations(recommendationText) {
    try {
      const jsonMatch = recommendationText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return [];
    } catch (error) {
      logger.warn('Failed to parse recommendations, returning empty array');
      return [];
    }
  }

  /**
   * Extract section from text
   * @private
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Calculate confidence score
   * @private
   */
  calculateConfidence(text) {
    // Simple confidence calculation based on text length and structure
    const wordCount = text.split(/\s+/).length;
    const hasStructure = text.includes('\n') && text.length > 500;
    
    let confidence = Math.min(wordCount / 1000, 0.8);
    if (hasStructure) confidence += 0.1;
    if (text.includes('timeline') || text.includes('budget')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

module.exports = new GeminiService();
