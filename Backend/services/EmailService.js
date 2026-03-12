const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendResetEmail = async (email, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: "vengalarohith15119@gmail.com", name: "CollabCode" };
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = "Password Reset Request";
  sendSmtpEmail.htmlContent = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password.</p>
    <a href="${resetURL}" style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
      Reset Password
    </a>
    <p>This link expires in 10 minutes.</p>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

const sendVerificationMail = async (email, VerifyToken) => {
  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-account/${VerifyToken}`;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: "vengalarohith15119@gmail.com", name: "CollabCode" };
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = "Verify your CollabCode account";
  sendSmtpEmail.htmlContent = `
    <h1>Verify your Account</h1>
    <p>Click below to get access to CollabCode.</p>
    <a href="${verifyUrl}" style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
      Verify Account
    </a>
    <p>This link expires in 24 hours.</p>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendResetEmail, sendVerificationMail };