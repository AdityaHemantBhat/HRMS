const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email
const sendEmail = async (options) => {
  try {
    const message = {
      from: `${process.env.FROM_NAME || 'TalentSphere'} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => `
    <h2>Welcome to TalentSphere!</h2>
    <p>Hello ${name},</p>
    <p>Welcome to our HRMS platform. Your account has been created successfully.</p>
    <p>Please login to complete your profile and start using the system.</p>
  `,

  lateLogin: (name, time) => `
    <h2>Late Login Alert</h2>
    <p>Hello ${name},</p>
    <p>You checked in late today at ${time}.</p>
    <p>Please ensure to check in on time.</p>
  `,

  missedCheckout: (name) => `
    <h2>Missed Checkout Alert</h2>
    <p>Hello ${name},</p>
    <p>You forgot to check out today.</p>
    <p>Please remember to check out at the end of your workday.</p>
  `,

  leaveApproved: (name, leaveType, startDate, endDate) => `
    <h2>Leave Approved</h2>
    <p>Hello ${name},</p>
    <p>Your ${leaveType} leave request from ${startDate} to ${endDate} has been approved.</p>
  `,

  leaveRejected: (name, leaveType, reason) => `
    <h2>Leave Rejected</h2>
    <p>Hello ${name},</p>
    <p>Your ${leaveType} leave request has been rejected.</p>
    <p>Reason: ${reason}</p>
  `,

  payrollGenerated: (name, month, year) => `
    <h2>Payroll Generated</h2>
    <p>Hello ${name},</p>
    <p>Your payroll for ${month}/${year} has been generated.</p>
    <p>Please login to view your payslip.</p>
  `,

  passwordReset: (name, resetUrl) => `
    <h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>You requested to reset your password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `
};

module.exports = { sendEmail, emailTemplates };
