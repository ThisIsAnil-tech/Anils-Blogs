const { Resend } = require('resend');
const logger = require('../utils/logger');

let resendInstance = null;

const initializeEmail = () => {
  try {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
    logger.info('✅ Email service initialized');
    return resendInstance;
  } catch (error) {
    logger.error(`❌ Email initialization failed: ${error.message}`);
    throw error;
  }
};

const sendEmail = async (options) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      from = process.env.EMAIL_FROM,
      replyTo,
    } = options;

    if (!resendInstance) {
      initializeEmail();
    }

    const result = await resendInstance.emails.send({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
    });

    logger.info(`📧 Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`);
    throw error;
  }
};

const sendWelcomeEmail = async (subscriber) => {
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
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome Aboard!</h1>
        <p>Thank you for subscribing to our blog</p>
      </div>
      <div class="content">
        <h2>Hello ${subscriber.username}!</h2>
        <p>We're excited to have you join our community. You'll now receive updates about our latest blog posts.</p>
        <p><strong>What you can expect:</strong></p>
        <ul>
          <li>📝 New blog post notifications</li>
          <li>💡 Exclusive tips and insights</li>
          <li>📊 Weekly newsletter with top content</li>
        </ul>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          You can unsubscribe anytime.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Your Blog. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: subscriber.email,
    subject,
    html,
    text: `Welcome ${subscriber.username}!\n\nThank you for subscribing to our blog.`
  });
};

const sendNewBlogNotification = async (subscriber, blog) => {
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📝 New Blog Post</h1>
        <p>Check out our latest content</p>
      </div>
      <div class="content">
        <h2>${blog.title}</h2>
        <p>Published: ${new Date(blog.publishDate).toLocaleDateString()} • ${blog.readingTime || 3} min read</p>
        ${blog.featuredImage ? `<img src="${blog.featuredImage}" alt="${blog.title}" style="max-width: 100%; height: auto; border-radius: 5px; margin: 20px 0;" />` : ''}
        <p>${blog.excerpt}</p>
        <a href="${process.env.APP_URL}/blogs/${blog.slug}" class="button">Read Full Blog</a>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Your Blog. All rights reserved.</p>
        <p><a href="${process.env.APP_URL}/unsubscribe" style="color: #999;">Unsubscribe</a></p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: subscriber.email,
    subject,
    html,
    text: `New Blog: ${blog.title}\n\n${blog.excerpt}\n\nRead more: ${process.env.APP_URL}/blogs/${blog.slug}`
  });
};

const sendBulkNotification = async (subscribers, blog) => {
  const results = [];
  const batchSize = 50;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    for (const subscriber of batch) {
      try {
        await sendNewBlogNotification(subscriber, blog);
        results.push({ email: subscriber.email, status: 'success' });
      } catch (error) {
        results.push({ email: subscriber.email, status: 'failed', error: error.message });
      }
    }

    // Wait between batches to avoid rate limits
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

module.exports = {
  initializeEmail,
  sendEmail,
  sendWelcomeEmail,
  sendNewBlogNotification,
  sendBulkNotification
};