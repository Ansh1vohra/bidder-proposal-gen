const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken, checkRole, checkSubscription } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: AI-powered tender and bidder recommendations
 */

/**
 * @swagger
 * /api/recommendations/tenders:
 *   get:
 *     summary: Get recommended tenders for user
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of recommendations to return
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by categories
 *       - in: query
 *         name: locations
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by locations
 *       - in: query
 *         name: budgetMin
 *         schema:
 *           type: number
 *         description: Minimum budget filter
 *       - in: query
 *         name: budgetMax
 *         schema:
 *           type: number
 *         description: Maximum budget filter
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [similarity, history, hybrid]
 *           default: hybrid
 *         description: Recommendation algorithm to use
 *     responses:
 *       200:
 *         description: Tender recommendations retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get('/tenders', authenticateToken, checkSubscription(['basic', 'premium', 'enterprise']), recommendationController.getTenderRecommendations);

/**
 * @swagger
 * /api/recommendations/bidders:
 *   get:
 *     summary: Get recommended bidders for a tender
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include bidder historical performance
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [profile_match, experience, success_rate, hybrid]
 *           default: hybrid
 *     responses:
 *       200:
 *         description: Bidder recommendations retrieved successfully
 *       400:
 *         description: Invalid tender ID
 *       404:
 *         description: Tender not found
 */
router.get('/bidders', authenticateToken, checkSubscription(['premium', 'enterprise']), recommendationController.getBidderRecommendations);

/**
 * @swagger
 * /api/recommendations/similar-tenders/{tenderId}:
 *   get:
 *     summary: Get tenders similar to specified tender
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.3
 *         description: Similarity threshold (0-1)
 *     responses:
 *       200:
 *         description: Similar tenders retrieved successfully
 *       404:
 *         description: Tender not found
 */
router.get('/similar-tenders/:tenderId', authenticateToken, recommendationController.getSimilarTenders);

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending tenders and categories
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tenders, categories, keywords]
 *           default: tenders
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending data retrieved successfully
 */
router.get('/trending', authenticateToken, recommendationController.getTrending);

/**
 * @swagger
 * /api/recommendations/preferences:
 *   get:
 *     summary: Get user recommendation preferences
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 */
router.get('/preferences', authenticateToken, recommendationController.getPreferences);

/**
 * @swagger
 * /api/recommendations/preferences:
 *   put:
 *     summary: Update user recommendation preferences
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred tender categories
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred locations
 *               budgetRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords of interest
 *               excludeKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords to exclude
 *               notificationSettings:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   frequency:
 *                     type: string
 *                     enum: [immediate, daily, weekly]
 *               algorithm:
 *                 type: string
 *                 enum: [similarity, history, hybrid]
 *                 default: hybrid
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid preference data
 */
router.put('/preferences', authenticateToken, recommendationController.updatePreferences);

/**
 * @swagger
 * /api/recommendations/feedback:
 *   post:
 *     summary: Provide feedback on recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendationId
 *               - feedbackType
 *               - rating
 *             properties:
 *               recommendationId:
 *                 type: string
 *               feedbackType:
 *                 type: string
 *                 enum: [tender_recommendation, bidder_recommendation, similar_tender]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               helpful:
 *                 type: boolean
 *               relevant:
 *                 type: boolean
 *               comments:
 *                 type: string
 *                 maxLength: 500
 *               action:
 *                 type: string
 *                 enum: [viewed, clicked, applied, ignored]
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid feedback data
 */
router.post('/feedback', authenticateToken, recommendationController.submitFeedback);

/**
 * @swagger
 * /api/recommendations/performance:
 *   get:
 *     summary: Get recommendation performance metrics
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tender_recommendations, bidder_recommendations, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', authenticateToken, checkSubscription(['premium', 'enterprise']), recommendationController.getPerformanceMetrics);

/**
 * @swagger
 * /api/recommendations/export:
 *   post:
 *     summary: Export recommendations to various formats
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - format
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [tender_recommendations, bidder_recommendations, trending]
 *               format:
 *                 type: string
 *                 enum: [csv, pdf, excel]
 *               filters:
 *                 type: object
 *               limit:
 *                 type: integer
 *                 maximum: 1000
 *     responses:
 *       200:
 *         description: Export file generated successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid export parameters
 */
router.post('/export', authenticateToken, checkSubscription(['premium', 'enterprise']), recommendationController.exportRecommendations);

// Admin routes
/**
 * @swagger
 * /api/recommendations/admin/analytics:
 *   get:
 *     summary: Get recommendation system analytics (Admin only)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [accuracy, engagement, conversion, satisfaction]
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/analytics', authenticateToken, checkRole(['admin']), recommendationController.getSystemAnalytics);

/**
 * @swagger
 * /api/recommendations/admin/retrain:
 *   post:
 *     summary: Trigger recommendation model retraining (Admin only)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelType:
 *                 type: string
 *                 enum: [tender_similarity, bidder_matching, trending]
 *               incremental:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Model retraining initiated successfully
 *       403:
 *         description: Admin access required
 */
router.post('/admin/retrain', authenticateToken, checkRole(['admin']), recommendationController.retrainModel);

module.exports = router;
