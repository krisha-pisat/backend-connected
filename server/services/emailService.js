// Mock email service for demo purposes
// In production, integrate with actual email service (SendGrid, AWS SES, Nodemailer, etc.)

const emailService = {
  /**
   * Send email notification for critical errors
   * @param {Object} errorLog - The error log object
   * @param {String} reason - Reason for notification ('severity' or 'repeated')
   */
  async sendErrorAlert(errorLog, reason = 'severity') {
    try {
      // Mock email sending - in production, use actual email service
      const emailContent = {
        to: process.env.ALERT_EMAIL || 'admin@example.com',
        subject: `🚨 Error Alert: ${errorLog.severity.toUpperCase()} - ${errorLog.service}`,
        body: `
          Alert Reason: ${reason === 'severity' ? 'Critical Severity Error' : 'Repeated Error Occurrence'}
          
          Error Details:
          - Severity: ${errorLog.severity}
          - Service: ${errorLog.service}
          - Error Type: ${errorLog.errorType}
          - Message: ${errorLog.message}
          - URL: ${errorLog.url || 'N/A'}
          - Timestamp: ${errorLog.createdAt}
          
          ${errorLog.stackTrace ? `Stack Trace:\n${errorLog.stackTrace}` : ''}
          
          This is a mock email. In production, this would be sent via your email service.
        `
      };

      // Log the email notification (mock)
      console.log('📧 EMAIL ALERT (Mock):', {
        to: emailContent.to,
        subject: emailContent.subject,
        timestamp: new Date().toISOString()
      });
      
      // In production, uncomment and configure:
      // const transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: process.env.EMAIL_USER,
      //     pass: process.env.EMAIL_PASS
      //   }
      // });
      // await transporter.sendMail({
      //   from: process.env.EMAIL_USER,
      //   to: emailContent.to,
      //   subject: emailContent.subject,
      //   text: emailContent.body
      // });

      return {
        success: true,
        message: 'Email alert sent (mock)',
        emailContent
      };
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Check if email should be sent for this error
   * @param {Object} errorLog - The error log object
   * @returns {Boolean}
   */
  async shouldSendEmail(errorLog) {
    // Send email for critical severity
    if (errorLog.severity === 'critical') {
      return true;
    }

    // Send email for repeated errors (same error in last hour)
    const isRepeated = await errorLog.isRepeated();
    if (isRepeated && (errorLog.severity === 'high' || errorLog.severity === 'medium')) {
      return true;
    }

    return false;
  }
};

module.exports = emailService;
