const MailSlurp = require('mailslurp-client').default;

const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });

exports.sendVerificationEmail = async (email, verificationToken) => {
  try {
    const inbox = await mailslurp.createInbox();
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await mailslurp.sendEmail(inbox.id, {
      to: [email],
      subject: 'Verify your email for Goldpay',
      body: `Please click the following link to verify your email: ${verificationLink}`,
      isHTML: false
    });

    return inbox.id;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};