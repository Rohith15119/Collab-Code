const nodemailer = require("nodemailer");

if (!process.env.EMAIL_ID || !process.env.EMAIL_PASSWORD) {
  throw new Error("Email service not Configured !");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetEmail = async (email, resetToken) => {
  try {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Auth System" <${process.env.EMAIL_ID}>`,
      to: email,
      subject: "Password Reset Request",
      text: `Reset your password: ${resetURL}`,
      html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; padding:30px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
              
              <tr>
                <td align="center">
                  <h2 style="margin:0; color:#111;">Password Reset Request</h2>
                  <p style="color:#555; margin-top:10px;">
                    You requested to reset your password.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:20px 0;">
                  <a href="${resetURL}"
                    style="background-color:#7c3aed; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:bold;">
                    Reset Password
                  </a>
                </td>
              </tr>

              <tr>
                <td align="center">
                  <p style="font-size:14px; color:#777;">
                    This link will expire in 10 minutes.
                  </p>
                  <p style="font-size:12px; color:#aaa; margin-top:20px;">
                    If you did not request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
    });
  } catch (err) {
    console.error("Gmail SMTP error:", err.message);
    throw new Error("Email failed");
  }
};

module.exports = { sendResetEmail };
