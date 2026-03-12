const Brevo = require("@getbrevo/brevo");

const client = Brevo.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
const api = new Brevo.TransactionalEmailsApi();

const sendResetEmail = async (email, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await api.sendTransacEmail({
    sender: { email: "collabcode17@gmail.com", name: "CollabCode" },
    to: [{ email }],
    subject: "Password Reset Request",
    htmlContent: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <a href="${resetURL}" style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in 10 minutes.</p>
    `,
  });
};

const sendVerificationMail = async (email, VerifyToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/api/auth/verify-account/${VerifyToken}`;

  await api.sendTransacEmail({
    sender: { email: "vengalarohith15119@gmail.com", name: "CollabCode" },
    to: [{ email }],
    subject: "Verify your CollabCode account",
    htmlContent: `
      <h1>Verify your Account</h1>
      <p>Click below to get access to CollabCode.</p>
      <a href="${verifyUrl}" style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
        Verify Account
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

module.exports = { sendResetEmail, sendVerificationMail };
