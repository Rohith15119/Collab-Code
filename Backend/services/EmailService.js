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
  console.log("📧 Attempting email to:", email);
  console.log("🔑 RESEND KEY exists:", !!process.env.RESEND_API_KEY);
  console.log("🌐 BACKEND_URL:", process.env.BACKEND_URL);

  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-account/${VerifyToken}`;
  console.log("🔗 Verify URL:", verifyUrl);

  const result = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify your CollabCode account",
    html: `<h1>Verify Account</h1><a href="${verifyUrl}">Click here</a>`,
  });

  console.log("📬 Resend result:", JSON.stringify(result));
};

module.exports = { sendResetEmail, sendVerificationMail };
