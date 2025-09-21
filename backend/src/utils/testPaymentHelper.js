/**
 * Development utility for testing subscription creation
 * This should only be used in development environment
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a test payment method for development
 */
async function createTestPaymentMethod(customerId) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Test payment methods can only be created in development mode');
  }

  try {
    // Create a test payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242', // Visa test card
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });

    // Attach to customer if provided
    if (customerId) {
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });
    }

    return paymentMethod;
  } catch (error) {
    console.error('Error creating test payment method:', error);
    throw error;
  }
}

/**
 * Get available test payment methods for development
 */
function getTestPaymentMethods() {
  return {
    visa: 'pm_card_visa',
    visa_debit: 'pm_card_visa_debit',
    mastercard: 'pm_card_mastercard',
    mastercard_debit: 'pm_card_mastercard_debit',
    amex: 'pm_card_amex',
    discover: 'pm_card_discover',
    // Declined cards for testing failures
    declined_generic: 'pm_card_declined',
    declined_insufficient_funds: 'pm_card_declined_insufficient_funds',
    declined_expired: 'pm_card_declined_expired_card'
  };
}

module.exports = {
  createTestPaymentMethod,
  getTestPaymentMethods
};
