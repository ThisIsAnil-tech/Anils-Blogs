const { Resend } = require('resend');
const logger = require('../utils/logger');

let resendInstance = null;
let isEmailConfigured = false;

const initializeEmail = () => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      logger.warn('⚠️ RESEND_API_KEY not set. Email service will be disabled.');
      isEmailConfigured = false;
      return null;
    }

    resendInstance = new Resend(apiKey);
    isEmailConfigured = true;
    logger.info('✅ Email service initialized');
    return resendInstance;
  } catch (error) {
    logger.error(`❌ Email initialization failed: ${error.message}`);
    isEmailConfigured = false;
    throw error;
  }
};

// Initialize on module load
initializeEmail();

const isEmailAvailable = () => {
  return isEmailConfigured && resendInstance !== null;
};

const sendEmail = async (options) => {
  try {
    if (!isEmailAvailable()) {
      throw new Error('Email service is not configured');
    }

    const {
      to,
      subject,
      html,
      text,
      from = process.env.EMAIL_FROM,
      replyTo,
      attachments,
      tags
    } = options;

    if (!to) {
      throw new Error('Recipient email (to) is required');
    }

    if (!subject) {
      throw new Error('Email subject is required');
    }

    if (!html && !text) {
      throw new Error('Email content (html or text) is required');
    }

    const emailData = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(replyTo && { reply_to: replyTo }),
      ...(attachments && { attachments }),
      ...(tags && { tags })
    };

    logger.info(`📧 Sending email to ${Array.isArray(to) ? to.join(', ') : to}`);

    const result = await resendInstance.emails.send(emailData);

    if (result.error) {
      throw new Error(result.error.message);
    }

    logger.info(`✅ Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
    return result;
  } catch (error) {
    logger.error(`❌ Email sending error: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendWelcomeEmail = async (subscriber) => {
  try {
    if (!isEmailAvailable()) {
      logger.warn('Email service not available. Welcome email not sent.');
      return null;
    }

    if (!subscriber.email) {
      logger.warn('No email provided for welcome email');
      return null;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const subject = 'Welcome to Our Blog! 📚';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .verification-link { color: #667eea; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome Aboard!</h1>
          <p>Thank you for subscribing to our blog</p>
        </div>
        <div class="content">
          <h2>Hello ${subscriber.username || 'Reader'}!</h2>
          <p>We're excited to have you join our community. You'll now receive updates about our latest blog posts.</p>
          <p><strong>What you can expect:</strong></p>
          <ul>
            <li>📫 New blog post notifications</li>
            <li>💡 Exclusive tips and insights</li>
            <li>📊 Weekly newsletter with top content</li>
          </ul>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            You can unsubscribe anytime by clicking the link in any email.
          </p>
          <a href="${appUrl}" class="button">Visit Our Blog</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${process.env.SITE_NAME || 'Your Blog'}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `Welcome ${subscriber.username || 'Reader'}!\n\nThank you for subscribing to our blog. You'll receive updates about our latest posts.\n\nYou can unsubscribe anytime.\n\nVisit our blog: ${appUrl}`;

    return sendEmail({
      to: subscriber.email,
      subject,
      html,
      text
    });
  } catch (error) {
    logger.error(`❌ Welcome email error: ${error.message}`);
    throw error;
  }
};

const sendNewBlogNotification = async (subscriber, blog) => {
  try {
    if (!isEmailAvailable()) {
      logger.warn('Email service not available. Notification not sent.');
      return null;
    }

    if (!subscriber.email) {
      logger.warn('No email provided for notification');
      return null;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const subject = `📝 New Blog: ${blog.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .featured-image { max-width: 100%; height: auto; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📝 New Blog Post</h1>
          <p>Check out our latest content</p>
        </div>
        <div class="content">
          <h2>${blog.title}</h2>
          <p>Published: ${blog.publishDate ? new Date(blog.publishDate).toLocaleDateString() : 'Just now'} • ${blog.readingTime || 3} min read</p>
          ${blog.featuredImage ? `<img src="${blog.featuredImage}" alt="${blog.title}" class="featured-image" />` : ''}
          <p>${blog.excerpt || 'Read the full article to learn more.'}</p>
          <a href="${appUrl}/blogs/${blog.slug}" class="button">Read Full Blog</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${process.env.SITE_NAME || 'Your Blog'}. All rights reserved.</p>
          <p><a href="${appUrl}/unsubscribe" style="color: #999;">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `New Blog: ${blog.title}\n\n${blog.excerpt || ''}\n\nRead more: ${appUrl}/blogs/${blog.slug}`;

    return sendEmail({
      to: subscriber.email,
      subject,
      html,
      text
    });
  } catch (error) {
    logger.error(`❌ New blog notification error: ${error.message}`);
    throw error;
  }
};

const sendBulkNotification = async (subscribers, blog) => {
  try {
    if (!isEmailAvailable()) {
      logger.warn('Email service not available. Bulk notification not sent.');
      return { total: 0, sent: 0, failed: 0, results: [] };
    }

    if (!subscribers || subscribers.length === 0) {
      logger.info('No subscribers to notify');
      return { total: 0, sent: 0, failed: 0, results: [] };
    }

    const results = [];
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    logger.info(`📧 Sending bulk notifications to ${subscribers.length} subscribers`);

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      // Send emails in parallel within batch
      const batchPromises = batch.map(async (subscriber) => {
        try {
          await sendNewBlogNotification(subscriber, blog);
          return { email: subscriber.email, status: 'success' };
        } catch (error) {
          logger.error(`Failed to send to ${subscriber.email}: ${error.message}`);
          return { email: subscriber.email, status: 'failed', error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        results.push(result);
        if (result.status === 'success') sentCount++;
        else failedCount++;
      });

      // Wait between batches to avoid rate limits
      if (i + batchSize < subscribers.length) {
        logger.debug(`Waiting 1 second before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info(`✅ Bulk notification complete: ${sentCount} sent, ${failedCount} failed`);

    return {
      total: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      results
    };
  } catch (error) {
    logger.error(`❌ Bulk notification error: ${error.message}`);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    if (!isEmailAvailable()) {
      return { success: false, message: 'Email service not configured' };
    }

    const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_FROM;
    if (!testEmail) {
      return { success: false, message: 'No test email address configured' };
    }

    const result = await sendEmail({
      to: testEmail,
      subject: 'Email Configuration Test',
      html: '<h1>Email Configuration Test</h1><p>This is a test email to verify the email configuration.</p>',
      text: 'Email Configuration Test - This is a test email.'
    });

    return { success: true, message: 'Test email sent successfully', result };
  } catch (error) {
    return { success: false, message: `Test failed: ${error.message}` };
  }
};

module.exports = {
  initializeEmail,
  sendEmail,
  sendWelcomeEmail,
  sendNewBlogNotification,
  sendBulkNotification,
  testEmailConfig,
  isEmailAvailable
};