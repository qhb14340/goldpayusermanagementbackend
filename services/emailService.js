
const MailSlurp = require('mailslurp-client').default;

const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });

exports.sendVerificationEmail = async (email, verificationToken) => {
  try {
    const inbox = await mailslurp.createInbox();
    const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;

    await mailslurp.sendEmail(inbox.id, {
      to: [email],
      subject: 'Verify your email for Goldpay',
      body: `Welcome to Goldpay! Please click the following link to verify your email: ${verificationLink}

If you didn't create this account, please ignore this email.

Best regards,
Goldpay Team`,
      isHTML: false
    });

    return inbox.id;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};
