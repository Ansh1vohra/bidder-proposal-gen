const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and subscription management
 */

/**
 * @swagger
 * /api/payments/create-subscription:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [basic, premium, enterprise]
 *               paymentMethodId:
 *                 type: string
 *               promotionCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid payment data or plan
 *       402:
 *         description: Payment required or failed
 */
router.post('/create-subscription', authenticateToken, paymentController.createSubscription);

/**
 * @swagger
 * /api/payments/update-subscription:
 *   put:
 *     summary: Update user's subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [basic, premium, enterprise]
 *               prorate:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Invalid plan or no active subscription
 *       402:
 *         description: Payment required
 */
router.put('/update-subscription', authenticateToken, paymentController.updateSubscription);

/**
 * @swagger
 * /api/payments/cancel-subscription:
 *   delete:
 *     summary: Cancel user's subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelAtPeriodEnd:
 *                 type: boolean
 *                 default: true
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       400:
 *         description: No active subscription found
 */
router.delete('/cancel-subscription', authenticateToken, paymentController.cancelSubscription);

/**
 * @swagger
 * /api/payments/payment-methods:
 *   get:
 *     summary: Get user's payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */
router.get('/payment-methods', authenticateToken, paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/payments/payment-methods:
 *   post:
 *     summary: Add a new payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Invalid payment method
 */
router.post('/payment-methods', authenticateToken, paymentController.addPaymentMethod);

/**
 * @swagger
 * /api/payments/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove a payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *       400:
 *         description: Cannot remove last payment method with active subscription
 *       404:
 *         description: Payment method not found
 */
router.delete('/payment-methods/:paymentMethodId', authenticateToken, paymentController.removePaymentMethod);

/**
 * @swagger
 * /api/payments/payment-methods/{paymentMethodId}/default:
 *   put:
 *     summary: Set payment method as default
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default payment method updated successfully
 *       404:
 *         description: Payment method not found
 */
router.put('/payment-methods/:paymentMethodId/default', authenticateToken, paymentController.setDefaultPaymentMethod);

/**
 * @swagger
 * /api/payments/subscription-status:
 *   get:
 *     summary: Get user's subscription status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 */
router.get('/subscription-status', authenticateToken, paymentController.getSubscriptionStatus);

/**
 * @swagger
 * /api/payments/billing-history:
 *   get:
 *     summary: Get user's billing history
 *     tags: [Payments]
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
 *           enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: Billing history retrieved successfully
 */
router.get('/billing-history', authenticateToken, paymentController.getBillingHistory);

/**
 * @swagger
 * /api/payments/invoices/{invoiceId}/download:
 *   get:
 *     summary: Download invoice PDF
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice PDF downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 */
router.get('/invoices/:invoiceId/download', authenticateToken, paymentController.downloadInvoice);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Request a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - reason
 *             properties:
 *               paymentId:
 *                 type: string
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (optional)
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid refund request
 *       404:
 *         description: Payment not found
 */
router.post('/refund', authenticateToken, paymentController.processRefund);

/**
 * @swagger
 * /api/payments/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Available plans retrieved successfully
 */
router.get('/plans', paymentController.getPlans);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Admin routes
/**
 * @swagger
 * /api/payments/admin/transactions:
 *   get:
 *     summary: Get all transactions (Admin only)
 *     tags: [Payments]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/transactions', authenticateToken, checkRole(['admin']), paymentController.getAllTransactions);

/**
 * @swagger
 * /api/payments/admin/revenue-stats:
 *   get:
 *     summary: Get revenue statistics (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/revenue-stats', authenticateToken, checkRole(['admin']), paymentController.getRevenueStats);

module.exports = router;
