const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { authenticateToken, checkSubscription, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Proposals
 *   description: AI-powered proposal generation and management
 */

/**
 * @swagger
 * /api/proposals/generate:
 *   post:
 *     summary: Generate AI proposal for a tender
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenderId
 *             properties:
 *               tenderId:
 *                 type: string
 *               userRequirements:
 *                 type: object
 *               customSections:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Proposal generated successfully
 *       400:
 *         description: Invalid input data or user already has proposal
 *       404:
 *         description: Tender not found
 */
router.post('/generate', authenticateToken, checkSubscription('basic'), proposalController.generateProposal);

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     summary: Get user's proposals
 *     tags: [Proposals]
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
 *           enum: [draft, submitted, under_review, accepted, rejected]
 *       - in: query
 *         name: tenderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 */
router.get('/', authenticateToken, proposalController.getMyProposals);

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [Proposals]
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
 *         description: Proposal retrieved successfully
 *       403:
 *         description: Not authorized to view this proposal
 *       404:
 *         description: Proposal not found
 */
router.get('/:id', authenticateToken, proposalController.getProposalById);

/**
 * @swagger
 * /api/proposals/{id}:
 *   put:
 *     summary: Update proposal content
 *     tags: [Proposals]
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
 *               content:
 *                 type: object
 *               userCustomization:
 *                 type: object
 *               submission:
 *                 type: object
 *               versionComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proposal updated successfully
 *       400:
 *         description: Cannot edit submitted proposals
 *       403:
 *         description: Not authorized to edit this proposal
 *       404:
 *         description: Proposal not found
 */
router.put('/:id', authenticateToken, proposalController.updateProposal);

/**
 * @swagger
 * /api/proposals/{id}/submit:
 *   post:
 *     summary: Submit proposal for evaluation
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finalReview:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Proposal submitted successfully
 *       400:
 *         description: Proposal already submitted or missing required sections
 *       403:
 *         description: Not authorized to submit this proposal
 *       404:
 *         description: Proposal not found
 */
router.post('/:id/submit', authenticateToken, proposalController.submitProposal);

/**
 * @swagger
 * /api/proposals/{id}/similar:
 *   get:
 *     summary: Get similar proposals for recommendations
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar proposals retrieved successfully
 *       403:
 *         description: Not authorized to view this proposal
 *       404:
 *         description: Proposal not found
 */
router.get('/:id/similar', authenticateToken, checkSubscription('professional'), proposalController.getSimilarProposals);

/**
 * @swagger
 * /api/proposals/{id}/collaborators:
 *   post:
 *     summary: Add collaborator to proposal
 *     tags: [Proposals]
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [view, comment, edit]
 *                 default: [view, comment]
 *     responses:
 *       200:
 *         description: Collaborator added successfully
 *       400:
 *         description: User already a collaborator
 *       403:
 *         description: Only proposal owner can add collaborators
 *       404:
 *         description: User or proposal not found
 */
router.post('/:id/collaborators', authenticateToken, checkSubscription('professional'), proposalController.addCollaborator);

/**
 * @swagger
 * /api/proposals/{id}/export:
 *   get:
 *     summary: Export proposal to various formats
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, docx, html]
 *           default: pdf
 *     responses:
 *       200:
 *         description: Proposal exported successfully
 *       403:
 *         description: Not authorized to export this proposal
 *       404:
 *         description: Proposal not found
 */
router.get('/:id/export', authenticateToken, proposalController.exportProposal);

/**
 * @swagger
 * /api/proposals/{id}:
 *   delete:
 *     summary: Delete proposal
 *     tags: [Proposals]
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
 *         description: Proposal deleted successfully
 *       400:
 *         description: Cannot delete submitted proposals
 *       403:
 *         description: Not authorized to delete this proposal
 *       404:
 *         description: Proposal not found
 */
router.delete('/:id', authenticateToken, proposalController.deleteProposal);

module.exports = router;
