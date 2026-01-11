const nodemailer = require('nodemailer');

// Create a transport using environment variables. If not configured, fallback to a stub that logs to console.
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  transporter = {
    sendMail: async (options) => {
      console.log('MAILER (stub) - sendMail called with:', options);
      return Promise.resolve();
    },
  };
}

module.exports = transporter;
