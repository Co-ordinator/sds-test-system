const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Configure handlebars
const handlebarOptions = {
  viewEngine: {
    extName: '.hbs',
    partialsDir: path.resolve(__dirname, '../templates/emails'),
    defaultLayout: false
  },
  viewPath: path.resolve(__dirname, '../templates/emails'),
  extName: '.hbs'
};

transporter.use('compile', hbs(handlebarOptions));

// Email sending function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"SDS Test System" <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      template: options.template,
      context: options.context
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
};

module.exports = {
  sendEmail
};
