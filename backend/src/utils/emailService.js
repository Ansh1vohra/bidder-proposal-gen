const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production email service (e.g., SendGrid, AWS SES, etc.)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else {
        // Development - use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      // Create a mock transporter for development if email fails
      this.transporter = {
        sendMail: async (mailOptions) => {
          logger.info('Mock email sent:', mailOptions);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@civilytix.com',
        to,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Email preview URL:', nodemailer.getTestMessageUrl(result));
      }

      logger.info(`Email sent successfully to ${to}: ${subject}`);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Civilytix!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Civilytix. To complete your registration and start exploring tender opportunities, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Civilytix. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Verify Your Email Address - Civilytix', htmlContent);
  }

  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #dc3545; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Civilytix account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This reset link will expire in 1 hour for security reasons.</li>
                <li>If you didn't request this password reset, please ignore this email.</li>
                <li>Your password will remain unchanged until you create a new one.</li>
              </ul>
            </div>
            <p>If you continue to have problems, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Civilytix. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Reset Your Password - Civilytix', htmlContent);
  }

  async sendWelcomeEmail(email, name) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to Civilytix</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .feature { margin: 15px 0; padding: 15px; background-color: white; border-radius: 5px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Civilytix!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to Civilytix! Your email has been verified and your account is now active.</p>
            <p>Here's what you can do with your account:</p>
            
            <div class="feature">
              <h3>🎯 Discover Relevant Tenders</h3>
              <p>Browse and search through thousands of tender opportunities tailored to your expertise.</p>
            </div>
            
            <div class="feature">
              <h3>🤖 AI-Powered Proposals</h3>
              <p>Generate professional proposals using our advanced AI technology to increase your chances of winning.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Smart Recommendations</h3>
              <p>Get personalized tender recommendations based on your profile and bidding history.</p>
            </div>
            
            <div class="feature">
              <h3>💡 Analytics & Insights</h3>
              <p>Track your performance and get insights to improve your bidding strategy.</p>
            </div>

            <p>Ready to get started?</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
            
            <p>If you have any questions, our support team is here to help. Just reply to this email or visit our help center.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Civilytix. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Welcome to Civilytix - Your Account is Ready!', htmlContent);
  }

  async sendSubscriptionConfirmation(email, name, planName, amount, billingPeriod) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Subscription Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .subscription-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for subscribing to Civilytix! Your ${planName} subscription has been successfully activated.</p>
            
            <div class="subscription-details">
              <h3>Subscription Details:</h3>
              <ul>
                <li><strong>Plan:</strong> ${planName}</li>
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Billing Cycle:</strong> ${billingPeriod}</li>
                <li><strong>Status:</strong> Active</li>
              </ul>
            </div>

            <p>You now have access to all premium features. Start exploring enhanced tender opportunities and AI-powered proposal generation!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Access Dashboard</a>
            
            <p>You can manage your subscription, update payment methods, or view billing history in your account settings.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Civilytix. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `Subscription Confirmed - ${planName} Plan Active`, htmlContent);
  }

  async sendProposalNotification(email, name, tenderTitle, proposalId) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Proposal Generated Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Proposal Ready!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Great news! Your AI-generated proposal for "<strong>${tenderTitle}</strong>" has been successfully created and is ready for review.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Review and edit the generated content</li>
              <li>Add your custom touches</li>
              <li>Download the proposal in various formats</li>
              <li>Submit it directly to the tender</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposals/${proposalId}" class="button">View Proposal</a>
            
            <p>Remember to review the proposal carefully before submission to ensure it meets all tender requirements.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Civilytix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `Proposal Ready - ${tenderTitle}`, htmlContent);
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
