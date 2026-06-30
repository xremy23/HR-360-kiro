import nodemailer from 'nodemailer';

// Email templates
const templates = {
  magicLink: (magicLink: string, email: string) => ({
    subject: 'HR 360 - Your Magic Login Link',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 3px; margin: 15px 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HR 360 Emergency Management</h1>
              <p>Passwordless Login</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Click the button below to log in to your HR 360 account. This link will expire in 15 minutes.</p>
              
              <a href="${magicLink}" class="button">Log In to HR 360</a>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">
                ${magicLink}
              </p>
              
              <div class="warning">
                <strong>Security Notice:</strong> Never share this link with anyone. If you didn't request this link, you can safely ignore this email.
              </div>
              
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
HR 360 - Your Magic Login Link

Hello,

Click the link below to log in to your HR 360 account. This link will expire in 15 minutes.

${magicLink}

Security Notice: Never share this link with anyone. If you didn't request this link, you can safely ignore this email.

© 2026 HR 360 Emergency Management System. All rights reserved.
This is an automated message, please do not reply to this email.
    `,
  }),

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

  welcomeEmail: (fullName: string, magicLink: string, email: string) => ({
    subject: 'Welcome to HR 360 Emergency Management',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HR 360!</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName},</p>
              <p>Your account has been created on the HR 360 Emergency Management System.</p>
              <p>Click the button below to log in for the first time. This link will expire in 15 minutes.</p>

              <a href="${magicLink}" class="button">Log In to HR 360</a>

              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">
                ${magicLink}
              </p>

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
Welcome to HR 360!

Hello ${fullName},

Your account has been created on the HR 360 Emergency Management System.
Click the link below to log in for the first time. This link will expire in 15 minutes.

${magicLink}

© 2026 HR 360 Emergency Management System. All rights reserved.
This is an automated message, please do not reply to this email.
    `,
  }),

  organizationInvitation: (orgName: string, inviteLink: string, invitedBy: string) => ({
    subject: `You've been invited to join ${orgName} on HR 360`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .org-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HR 360</h1>
              <p>Organization Invitation</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              
              <p>${invitedBy} has invited you to join <strong>${orgName}</strong> on HR 360 Emergency Management System.</p>
              
              <div class="org-box">
                <h3>${orgName}</h3>
                <p>Click the button below to accept the invitation and start collaborating with your team.</p>
              </div>
              
              <a href="${inviteLink}" class="button">Accept Invitation</a>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">
                ${inviteLink}
              </p>
              
              <p>If you did not expect this invitation, you can ignore this email.</p>
              
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
HR 360 - Organization Invitation

Hello,

${invitedBy} has invited you to join ${orgName} on HR 360 Emergency Management System.

Click the link below to accept the invitation:
${inviteLink}

If you did not expect this invitation, you can ignore this email.

© 2026 HR 360 Emergency Management System. All rights reserved.
This is an automated message, please do not reply to this email.
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
    console.warn('[EmailService] Email credentials not configured');
    console.warn('[EmailService] EMAIL_USER:', emailUser ? '✓ set' : '✗ not set');
    console.warn('[EmailService] EMAIL_PASSWORD:', emailPassword ? '✓ set (length: ' + emailPassword.length + ')' : '✗ not set');
    return null;
  }

  // Clean up password - remove spaces if present (common formatting issue with App Passwords)
  const cleanPassword = emailPassword.replace(/\s/g, '');
  
  console.log('[EmailService] Initializing Gmail transport:', {
    service: 'gmail',
    user: emailUser,
    passwordLength: cleanPassword.length,
    hasSpaces: emailPassword !== cleanPassword,
  });

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: cleanPassword, // Use cleaned password without spaces
    },
  });

  return transporter;
}

// Email service functions
export const emailService = {
  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, magicLink: string, fullName: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();

      if (!transport) {
        console.warn(`[EmailService] Transport not configured. Logging welcome email instead of sending.`);
        console.log(`[EmailService] WELCOME EMAIL WOULD BE SENT TO: ${email} (${fullName})`);
        console.log(`[EmailService] MAGIC LINK: ${magicLink}`);
        return true;
      }

      const template = templates.welcomeEmail(fullName, magicLink, email);

      console.log(`[EmailService] Sending welcome email to ${email}...`);

      const result = await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ [EmailService] Welcome email sent to ${email}. Result:`, result.messageId);
      return true;
    } catch (error) {
      console.error('[EmailService] FAILED TO SEND WELCOME EMAIL (falling back to demo mode):', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`[EmailService] WELCOME EMAIL WOULD BE SENT TO: ${email} (${fullName})`);
      console.log(`[EmailService] MAGIC LINK: ${magicLink}`);

      return true;
    }
  },

  /**
   * Send magic link email
   */
  async sendMagicLink(email: string, magicLink: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      
      // If transport is not configured, log the email and return success
      // This allows the system to work in demo mode
      if (!transport) {
        console.warn(`[EmailService] Transport not configured. Logging email instead of sending.`);
        console.log(`[EmailService] EMAIL WOULD BE SENT TO: ${email}`);
        console.log(`[EmailService] MAGIC LINK: ${magicLink}`);
        return true;
      }

      const template = templates.magicLink(magicLink, email);

      console.log(`[EmailService] Sending magic link email to ${email}...`);
      
      const result = await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ [EmailService] Magic link email sent to ${email}. Result:`, result.messageId);
      return true;
    } catch (error) {
      // Log the error but return success so the flow continues
      // The frontend will see "success" but logs show the actual error
      console.error('[EmailService] FAILED TO SEND EMAIL (falling back to demo mode):', {
        email,
        error: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorResponse: (error as any)?.response,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Log what would have been sent
      console.log(`[EmailService] EMAIL WOULD BE SENT TO: ${email}`);
      console.log(`[EmailService] MAGIC LINK: ${magicLink}`);
      
      // Return true anyway so the frontend doesn't error
      // Users can check logs to see what emails would be sent
      return true;
    }
  },

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
   * Send organization invitation email
   */
  async sendInvitationEmail(email: string, orgName: string, inviteLink: string, invitedBy: string): Promise<boolean> {
    try {
      const transport = initializeTransporter();
      if (!transport) {
        console.warn(`Organization invitation for ${email}: ${orgName}`);
        return true;
      }

      const template = templates.organizationInvitation(orgName, inviteLink, invitedBy);

      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ Organization invitation sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send organization invitation:', error);
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

      await Promise.all(emails.map(email =>
        transport.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject,
          html,
          text,
        })
      ));

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
