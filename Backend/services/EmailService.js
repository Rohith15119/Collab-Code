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
  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-account/${VerifyToken}`;

  await resend.emails.send({
    from: "CollabCode <onboarding@resend.dev>",
    to: email,
    subject: "Verify your CollabCode account",
    html: `
      <h1>Verify your Account</h1>
      <p>Click below to get access to CollabCode.</p>
      <a href="${verifyUrl}" 
         style="background:#7c3aed;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">
         Verify Account
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

module.exports = { sendResetEmail, sendVerificationMail };
