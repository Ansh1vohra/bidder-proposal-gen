const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
  }

  /**
   * Create a new customer in Stripe
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          userId: customerData.userId,
          userType: customerData.userType || 'bidder'
        }
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer: ' + error.message);
    }
  }

  /**
   * Create subscription plans
   * @returns {Promise<Object>} Created plans
   */
  async createSubscriptionPlans() {
    try {
      const plans = {
        basic: {
          id: 'basic-monthly',
          name: 'Basic Plan',
          amount: 2999, // $29.99
          currency: 'usd',
          interval: 'month',
          features: ['5 AI proposals per month', 'Basic tender alerts', 'Email support']
        },
        professional: {
          id: 'professional-monthly',
          name: 'Professional Plan',
          amount: 5999, // $59.99
          currency: 'usd',
          interval: 'month',
          features: ['20 AI proposals per month', 'Advanced tender alerts', 'Priority support', 'Custom templates']
        },
        enterprise: {
          id: 'enterprise-monthly',
          name: 'Enterprise Plan',
          amount: 9999, // $99.99
          currency: 'usd',
          interval: 'month',
          features: ['Unlimited AI proposals', 'Advanced analytics', 'Dedicated support', 'API access']
        }
      };

      const createdPlans = {};

      for (const [key, planData] of Object.entries(plans)) {
        try {
          // Try to retrieve existing plan first
          const existingPlan = await stripe.prices.retrieve(planData.id).catch(() => null);
          
          if (!existingPlan) {
            // Create product first
            const product = await stripe.products.create({
              id: `product-${planData.id}`,
              name: planData.name,
              description: planData.features.join(', '),
              metadata: {
                features: JSON.stringify(planData.features)
              }
            });

            // Create price
            const price = await stripe.prices.create({
              id: planData.id,
              product: product.id,
              unit_amount: planData.amount,
              currency: planData.currency,
              recurring: {
                interval: planData.interval,
              },
            });

            createdPlans[key] = price;
          } else {
            createdPlans[key] = existingPlan;
          }
        } catch (error) {
          if (error.code !== 'resource_already_exists') {
            logger.error(`Error creating plan ${key}:`, error);
          }
        }
      }

      logger.info('Subscription plans initialized');
      return createdPlans;
    } catch (error) {
      logger.error('Error creating subscription plans:', error);
      throw new Error('Failed to create subscription plans: ' + error.message);
    }
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} priceId - Stripe price ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Subscription object
   */
  async createSubscription(customerId, priceId, paymentMethodId) {
    try {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      logger.info(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription: ' + error.message);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      logger.info(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription: ' + error.message);
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} newPriceId - New price ID
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
      });

      logger.info(`Subscription updated: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription: ' + error.message);
    }
  }

  /**
   * Retrieve subscription details
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer']
      });
      return subscription;
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription: ' + error.message);
    }
  }

  /**
   * Handle webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
          return { received: true };
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook: ' + error.message);
    }
  }

  /**
   * Create a payment intent for one-time payments
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: { enabled: true },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent: ' + error.message);
    }
  }

  /**
   * Get customer's payment methods
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Error retrieving payment methods:', error);
      throw new Error('Failed to retrieve payment methods: ' + error.message);
    }
  }

  // Private webhook handlers
  async handleSubscriptionCreated(subscription) {
    logger.info(`Subscription created: ${subscription.id}`);
    // Update user subscription status in database
    return { received: true };
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Update user subscription status in database
    return { received: true };
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info(`Subscription deleted: ${subscription.id}`);
    // Update user subscription status in database
    return { received: true };
  }

  async handlePaymentSucceeded(invoice) {
    logger.info(`Payment succeeded for invoice: ${invoice.id}`);
    // Update payment records in database
    return { received: true };
  }

  async handlePaymentFailed(invoice) {
    logger.info(`Payment failed for invoice: ${invoice.id}`);
    // Handle failed payment, notify user, etc.
    return { received: true };
  }
}

module.exports = new PaymentService();
