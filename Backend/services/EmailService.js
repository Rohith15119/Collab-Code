const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (email, resetToken) => {
  try {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await resend.emails.send({
      from: "Auth System <onboarding@resend.dev>",
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <a href="${resetURL}" 
           style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
           Reset Password
        </a>
        <p>This link expires in 10 minutes.</p>
      `,
    });

    return true;
  } catch (err) {
    console.error("Resend API error:", err);
    throw new Error("Email failed");
  }
};

const sendVerificationMail = async (email, VerifyToken) => {
  try {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-account/${VerifyToken}`;

    await resend.emails.send({
      from: "Account System <onboarding@resend.dev>",
      to: email,
      subject: "Account Verification Needed",
      html: `
        <h1> Verify your Account to get access to Collab Code </h1>
        <p>You requested to verify the account as soon as possible.</p>
        <a href="${verifyUrl}" 
           style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
           Verify Account
        </a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return true;
  } catch (err) {
    console.error("Resend API error:", err);
    throw new Error("Email failed");
  }
};

module.exports = { sendResetEmail, sendVerificationMail };
