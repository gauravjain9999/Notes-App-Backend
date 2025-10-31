const logger = require('../utils/logger');
const Email = require('../models/email');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailHtml = `
<div style="font-family:Roboto,Arial,sans-serif;background:#f4f4f4;padding:40px;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);text-align:center;">
    <h2 style="color:#3f51b5;">Welcome to SmartNotes 🎉</h2>
    <p style="font-size:16px;color:#444;">Thanks for subscribing to our updates. We're glad to have you with us!</p>
    <p style="margin-top:24px;">
      <a href="http://localhost:4200/notes-app" style="background:#3f51b5;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Go to Dashboard</a>
    </p>
    <p style="margin-top:32px;font-size:12px;color:#888;">You’re receiving this email because you signed up for updates.</p>
  </div>
</div>
`;

module.exports = {
    /**
     * Handles newsletter subscription. If the email is new, it gets saved
     * and an email is sent to the admin and the user.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @returns {Promise} - A promise that resolves to an object containing the response data.
     */
    sendEmail: async (req, res) => {
      const { email } = req.body;
      console.log(req.body);
      if (!email) return res.status(400).json({
            apiResponseData: {
                apiResponseMessage: 'Email is required'
            },
            apiResponseStatus: false
        }
      );
      try {
        // Check if the email already exists
        const existing = await Email.findOne({ email });
        if (existing) return res.status(400).json({
             apiResponseData: {
                apiResponseMessage: 'Email already subscribed'
            },
            apiResponseStatus: false
        });
        // Create a new email subscriber
        const subscriber = new Email({ email });
        await subscriber.save();

        // Notify Admin
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: 'New SmartNotes Subscription',
          text: `New subscriber: ${email}`,
        });

        // Send Confirmation to User
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to SmartNotes!',
          text: `You've successfully subscribed to updates.`,
          html: emailHtml
        });
        res.status(200).json({
            apiResponseData: {
                apiResponseMessage: 'Subscription successful' 
            },
            apiResponseStatus: true
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
         apiResponseData: {
                apiResponseMessage: 'Something went wrong'
            },
            apiResponseStatus: false
        });
      }
    }
}