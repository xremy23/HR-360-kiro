import nodemailer from 'nodemailer';

// Email templates
const templates = {
  verificationCode: (code: string, email: string) => ({
    subject: 'HR 360 - Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .code-box { background: white; border: 2px solid #667eea; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 3px; margin: 15px 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HR 360 Emergency Management</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for signing up for HR 360. To complete your email verification, please use the code below:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p>This code will expire in 10 minutes.</p>
              
              <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. HR 360 staff will never ask for this code.
              </div>
              
              <p>If you didn't request this code, you can safely ignore this email.</p>
              
              <div class="footer">
                <p>© 2026 HR 360 Emergency Management System. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
HR 360 - Email Verification

Hello,

Thank you for signing up for HR 360. To complete your email verification, please use the code below:

${code}

This code will expire in 10 minutes.

Security Notice: Never share this code with anyone. HR 360 staff will never ask for this code.

If you didn't request this code, you can safely ignore this email.

© 2026 HR 360 Emergency Management System. All rights reserved.
This is an automated message, please do not reply to this email.
    `,
  }),

  alertNotification: (alertTitle: string, alertMessage: string, severity: string) => ({
    subject: `HR 360 Alert: ${alertTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .alert-box { padding: 15px; margin: 20px 0; border-radius: 5px; }
            .alert-critical { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .alert-high { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            .alert-medium { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
            .alert-low { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HR 360 Emergency Alert</h1>
            </div>
            <div class="content">
              <p>An emergency alert has been issued:</p>
              
              <div class="alert-box alert-${severity.toLowerCase()}">
                <h2>${alertTitle}</h2>
                <p>${alertMessage}</p>
                <p><strong>Severity:</strong> ${severity}</p>
              </div>
              
              <p>Please log in to HR 360 to view more details and take appropriate action.</p>
              
              <div class="footer">
                <p>© 2026 HR 360 Emergency Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
HR 360 - Emergency Alert

${alertTitle}

${alertMessage}

Severity: ${severity}

Please log in to HR 360 to view more details and take appropriate action.

© 2026 HR 360 Emergency Management System. All rights reserved.
    `,
  }),

  sosNotification: (userName: string, userEmail: string) => ({
    subject: 'HR 360 - SOS Alert Received',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .alert-box { background: #f8d7da; border: 2px solid #f5c6cb; color: #721c24; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 SOS Alert</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2>SOS Signal Received</h2>
                <p><strong>User:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Status:</strong> URGENT - Immediate assistance may be needed</p>
              </div>
              
              <p>An SOS signal has been triggered. Please take immediate action:</p>
              <ul>
                <li>Contact the user immediately</li>
                <li>Verify their location and status</li>
                <li>Escalate to emergency services if necessary</li>
                <li>Log in to HR 360 for more details</li>
              </ul>
              
              <div class="footer">
                <p>© 2026 HR 360 Emergency Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🚨 SOS Alert

SOS Signal Received

User: ${userName}
Email: ${userEmail}
Status: URGENT - Immediate assistance may be needed

An SOS signal has been triggered. Please take immediate action:
- Contact the user immediately
- Verify their location and status
- Escalate to emergency services if necessary
- Log in to HR 360 for more details

© 2026 HR 360 Emergency Management System. All rights reserved.
    `,
  }),
};

// Initialize transporter
let transporter: nodemailer.Transporter | null = null;

function initializeTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  return transporter;
}

// Email service functions
export const emailService = {
  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn(`Verification code for ${email}: ${code}`);
        return true; // Return true to allow testing without email service
      }

      const template = templates.verificationCode(code, email);

      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  },

  /**
   * Send alert notification email
   */
  async sendAlertNotification(
    email: string,
    alertTitle: string,
    alertMessage: string,
    severity: string
  ): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn(`Alert notification for ${email}: ${alertTitle}`);
        return true;
      }

      const template = templates.alertNotification(alertTitle, alertMessage, severity);

      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ Alert notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send alert notification:', error);
      return false;
    }
  },

  /**
   * Send SOS notification email
   */
  async sendSOSNotification(email: string, userName: string, userEmail: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn(`SOS notification for ${email}: ${userName}`);
        return true;
      }

      const template = templates.sosNotification(userName, userEmail);

      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ SOS notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send SOS notification:', error);
      return false;
    }
  },

  /**
   * Send bulk email
   */
  async sendBulkEmail(emails: string[], subject: string, html: string, text: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn(`Bulk email to ${emails.length} recipients: ${subject}`);
        return true;
      }

      for (const email of emails) {
        await transport.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject,
          html,
          text,
        });
      }

      console.log(`✅ Bulk email sent to ${emails.length} recipients`);
      return true;
    } catch (error) {
      console.error('Failed to send bulk email:', error);
      return false;
    }
  },

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn('Email service not configured');
        return false;
      }

      await transport.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  },
};

export default emailService;
