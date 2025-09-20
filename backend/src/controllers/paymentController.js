const Payment = require('../models/Payment');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

/**
 * Create payment intent for one-time payment
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'USD', description, metadata = {} } = req.body;

    // Validation
    if (!amount || amount < 50) { // Minimum 50 cents
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $0.50'
      });
    }

    // Create payment intent through Stripe
    const paymentIntent = await paymentService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: req.user.stripeCustomerId,
      description: description || 'One-time payment',
      metadata: {
        userId: req.user._id.toString(),
        ...metadata
      }
    });

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      stripe: {
        customerId: req.user.stripeCustomerId,
        paymentIntentId: paymentIntent.id
      },
      type: 'one_time',
      amount: Math.round(amount * 100),
      currency,
      description,
      metadata: {
        source: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        ...metadata
      }
    });

    await payment.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id
      }
    });

  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

/**
 * Create subscription
 */
const createSubscription = async (req, res) => {
  try {
    const { priceId, paymentMethodId } = req.body;

    if (!priceId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Price ID and payment method ID are required'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Payment.findOne({
      userId: req.user._id,
      type: 'subscription',
      'subscription.subscriptionStatus': 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Create subscription through Stripe
    const subscription = await paymentService.createSubscription({
      customer: req.user.stripeCustomerId,
      priceId,
      paymentMethodId,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    // Determine plan from price ID
    const planMapping = {
      [process.env.STRIPE_BASIC_PRICE_ID]: 'basic',
      [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise'
    };

    const plan = planMapping[priceId] || 'basic';

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      stripe: {
        customerId: req.user.stripeCustomerId,
        subscriptionId: subscription.id,
        paymentMethodId
      },
      type: 'subscription',
      amount: subscription.items.data[0].price.unit_amount,
      currency: subscription.currency,
      subscription: {
        plan,
        priceId,
        billingCycle: subscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'yearly',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        subscriptionStatus: subscription.status
      },
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription`,
      metadata: {
        source: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await payment.save();

    // Update user subscription details
    req.user.subscription = {
      isActive: subscription.status === 'active',
      plan,
      startDate: new Date(subscription.current_period_start * 1000),
      expiresAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id
    };

    await req.user.save();

    logger.info(`Subscription created: ${plan} for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: payment.subscription,
        paymentId: payment._id
      }
    });

  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const { immediate = false, reason } = req.body;

    // Find active subscription
    const payment = await Payment.findOne({
      userId: req.user._id,
      type: 'subscription',
      'subscription.subscriptionStatus': 'active'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel subscription through Stripe
    const canceledSubscription = await paymentService.cancelSubscription(
      payment.stripe.subscriptionId,
      immediate
    );

    // Update payment record
    payment.subscription.subscriptionStatus = canceledSubscription.status;
    payment.subscription.cancelAtPeriodEnd = canceledSubscription.cancel_at_period_end;
    payment.subscription.canceledAt = new Date();
    payment.subscription.cancelReason = reason || 'User requested cancellation';

    await payment.save();

    // Update user subscription
    if (immediate) {
      req.user.subscription.isActive = false;
      req.user.subscription.expiresAt = new Date();
    } else {
      req.user.subscription.expiresAt = new Date(canceledSubscription.current_period_end * 1000);
    }

    await req.user.save();

    logger.info(`Subscription canceled: ${immediate ? 'immediately' : 'at period end'} for user ${req.user.email}`);

    res.json({
      success: true,
      message: immediate 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the current period',
      data: {
        subscription: payment.subscription
      }
    });

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

/**
 * Update subscription
 */
const updateSubscription = async (req, res) => {
  try {
    const { newPriceId } = req.body;

    if (!newPriceId) {
      return res.status(400).json({
        success: false,
        message: 'New price ID is required'
      });
    }

    // Find active subscription
    const payment = await Payment.findOne({
      userId: req.user._id,
      type: 'subscription',
      'subscription.subscriptionStatus': 'active'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Update subscription through Stripe
    const updatedSubscription = await paymentService.updateSubscription(
      payment.stripe.subscriptionId,
      newPriceId
    );

    // Determine new plan
    const planMapping = {
      [process.env.STRIPE_BASIC_PRICE_ID]: 'basic',
      [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise'
    };

    const newPlan = planMapping[newPriceId] || 'basic';

    // Create new payment record for the upgrade/downgrade
    const newPayment = new Payment({
      userId: req.user._id,
      stripe: {
        customerId: req.user.stripeCustomerId,
        subscriptionId: updatedSubscription.id
      },
      type: 'upgrade',
      amount: updatedSubscription.items.data[0].price.unit_amount,
      currency: updatedSubscription.currency,
      subscription: {
        plan: newPlan,
        priceId: newPriceId,
        billingCycle: updatedSubscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'yearly',
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        subscriptionStatus: updatedSubscription.status
      },
      description: `Subscription updated to ${newPlan}`,
      status: 'succeeded',
      paymentDate: new Date()
    });

    await newPayment.save();

    // Update old payment record
    payment.subscription.subscriptionStatus = 'canceled';
    await payment.save();

    // Update user subscription
    req.user.subscription = {
      isActive: true,
      plan: newPlan,
      startDate: new Date(updatedSubscription.current_period_start * 1000),
      expiresAt: new Date(updatedSubscription.current_period_end * 1000),
      stripeSubscriptionId: updatedSubscription.id
    };

    await req.user.save();

    logger.info(`Subscription updated: ${newPlan} for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: newPayment.subscription
      }
    });

  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
};

/**
 * Get user's payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;

    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const payments = await Payment.getUserPaymentHistory(req.user._id, parseInt(limit));

    res.json({
      success: true,
      data: { payments }
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history'
    });
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check ownership or admin rights
    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    logger.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment'
    });
  }
};

/**
 * Request refund
 */
const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check ownership
    if (payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    // Check if payment can be refunded
    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be refunded'
      });
    }

    // Default to full refund if amount not specified
    const refundAmount = amount || (payment.amount - payment.totalRefunded);

    if (refundAmount > (payment.amount - payment.totalRefunded)) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds available amount'
      });
    }

    // Process refund through Stripe
    const refund = await paymentService.createRefund(
      payment.stripe.paymentIntentId || payment.stripe.chargeId,
      refundAmount,
      reason
    );

    // Add refund to payment
    await payment.addRefund({
      refundId: refund.id,
      amount: refundAmount,
      reason: reason || 'Customer requested refund',
      status: refund.status,
      processedAt: new Date(),
      requestedBy: req.user._id
    });

    logger.info(`Refund requested: ${refundAmount / 100} for payment ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund: {
          amount: refundAmount,
          status: refund.status,
          refundId: refund.id
        }
      }
    });

  } catch (error) {
    logger.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};

/**
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = paymentService.constructWebhookEvent(req.body, sig);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook handling error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook handling failed'
    });
  }
};

// Webhook event handlers
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const payment = await Payment.findOne({
    'stripe.paymentIntentId': paymentIntent.id
  });

  if (payment) {
    payment.status = 'succeeded';
    payment.paymentDate = new Date();
    await payment.addWebhookEvent({
      eventId: paymentIntent.id,
      eventType: 'payment_intent.succeeded',
      data: paymentIntent
    });
  }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({
    'stripe.paymentIntentId': paymentIntent.id
  });

  if (payment) {
    payment.status = 'failed';
    payment.errors.push({
      code: paymentIntent.last_payment_error?.code || 'unknown',
      message: paymentIntent.last_payment_error?.message || 'Payment failed',
      details: paymentIntent.last_payment_error
    });
    await payment.addWebhookEvent({
      eventId: paymentIntent.id,
      eventType: 'payment_intent.payment_failed',
      data: paymentIntent
    });
  }
};

const handleSubscriptionUpdated = async (subscription) => {
  const payment = await Payment.findOne({
    'stripe.subscriptionId': subscription.id
  });

  if (payment) {
    await payment.updateSubscriptionStatus(subscription.status, {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    await payment.addWebhookEvent({
      eventId: subscription.id,
      eventType: 'customer.subscription.updated',
      data: subscription
    });
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  const payment = await Payment.findOne({
    'stripe.subscriptionId': subscription.id
  });

  if (payment) {
    await payment.updateSubscriptionStatus('canceled', {
      canceledAt: new Date()
    });

    // Update user subscription
    const user = await User.findById(payment.userId);
    if (user) {
      user.subscription.isActive = false;
      await user.save();
    }

    await payment.addWebhookEvent({
      eventId: subscription.id,
      eventType: 'customer.subscription.deleted',
      data: subscription
    });
  }
};

const handleInvoicePaymentSucceeded = async (invoice) => {
  const payment = await Payment.findOne({
    'stripe.subscriptionId': invoice.subscription
  });

  if (payment) {
    payment.status = 'succeeded';
    payment.paymentDate = new Date();
    await payment.addWebhookEvent({
      eventId: invoice.id,
      eventType: 'invoice.payment_succeeded',
      data: invoice
    });
  }
};

const handleInvoicePaymentFailed = async (invoice) => {
  const payment = await Payment.findOne({
    'stripe.subscriptionId': invoice.subscription
  });

  if (payment) {
    payment.status = 'failed';
    await payment.addWebhookEvent({
      eventId: invoice.id,
      eventType: 'invoice.payment_failed',
      data: invoice
    });
  }
};

module.exports = {
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  getPaymentHistory,
  getPaymentById,
  requestRefund,
  handleWebhook
};
