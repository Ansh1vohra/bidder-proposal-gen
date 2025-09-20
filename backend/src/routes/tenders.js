const express = require('express');
const router = express.Router();
const tenderController = require('../controllers/tenderController');
const { authenticateToken, checkSubscription, checkRole, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tenders
 *   description: Tender management and operations
 */

/**
 * @swagger
 * /api/tenders:
 *   get:
 *     summary: Get all tenders with filtering and pagination
 *     tags: [Tenders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, draft, evaluation, awarded, closed, cancelled]
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: publishDate
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Tenders retrieved successfully
 */
router.get('/', optionalAuth, tenderController.getTenders);

/**
 * @swagger
 * /api/tenders/stats:
 *   get:
 *     summary: Get tender statistics
 *     tags: [Tenders]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', tenderController.getTenderStats);

/**
 * @swagger
 * /api/tenders/search:
 *   post:
 *     summary: Search tenders using AI embeddings
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               limit:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.post('/search', authenticateToken, checkSubscription('basic'), tenderController.searchTenders);

/**
 * @swagger
 * /api/tenders/trending:
 *   get:
 *     summary: Get trending tenders
 *     tags: [Tenders]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending tenders retrieved successfully
 */
router.get('/trending', tenderController.getTrendingTenders);

/**
 * @swagger
 * /api/tenders/my:
 *   get:
 *     summary: Get current user's tenders
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's tenders retrieved successfully
 */
router.get('/my', authenticateToken, tenderController.getMyTenders);

/**
 * @swagger
 * /api/tenders/industry/{industry}:
 *   get:
 *     summary: Get tenders by industry
 *     tags: [Tenders]
 *     parameters:
 *       - in: path
 *         name: industry
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Industry tenders retrieved successfully
 */
router.get('/industry/:industry', tenderController.getTendersByIndustry);

/**
 * @swagger
 * /api/tenders/{id}:
 *   get:
 *     summary: Get tender by ID
 *     tags: [Tenders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tender retrieved successfully
 *       404:
 *         description: Tender not found
 */
router.get('/:id', optionalAuth, tenderController.getTenderById);

/**
 * @swagger
 * /api/tenders:
 *   post:
 *     summary: Create new tender
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - industry
 *               - tenderType
 *               - submissionDeadline
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               industry:
 *                 type: string
 *               tenderType:
 *                 type: string
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *               estimatedValue:
 *                 type: number
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tender created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', authenticateToken, checkSubscription('basic'), tenderController.createTender);

/**
 * @swagger
 * /api/tenders/{id}:
 *   put:
 *     summary: Update tender
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               industry:
 *                 type: string
 *               tenderType:
 *                 type: string
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *               estimatedValue:
 *                 type: number
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tender updated successfully
 *       403:
 *         description: Not authorized to update this tender
 *       404:
 *         description: Tender not found
 */
router.put('/:id', authenticateToken, tenderController.updateTender);

/**
 * @swagger
 * /api/tenders/{id}/status:
 *   patch:
 *     summary: Update tender status
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, draft, evaluation, awarded, closed, cancelled]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tender status updated successfully
 *       403:
 *         description: Not authorized to update this tender
 *       404:
 *         description: Tender not found
 */
router.patch('/:id/status', authenticateToken, tenderController.updateTenderStatus);

/**
 * @swagger
 * /api/tenders/{id}:
 *   delete:
 *     summary: Delete tender
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tender deleted successfully
 *       400:
 *         description: Cannot delete tender with proposals
 *       403:
 *         description: Not authorized to delete this tender
 *       404:
 *         description: Tender not found
 */
router.delete('/:id', authenticateToken, tenderController.deleteTender);

module.exports = router;
