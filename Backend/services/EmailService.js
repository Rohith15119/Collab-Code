const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendResetEmail = async (email, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: "collabcode17@gmail.com",
    name: "CollabCode",
  };
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = "Password Reset Request";
  sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:#4ade80;">⚡</span>
                <span style="color:#ffffff;"> Collab</span><span style="color:#4ade80;">Code</span>
              </h1>
              <p style="margin:6px 0 0;color:#6b7280;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                Unique Coding Platform
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:20px;border:1px solid #ffffff10;overflow:hidden;">
              
              <!-- Red top bar for urgency -->
              <div style="height:4px;background:linear-gradient(90deg,#f87171,#fb923c,#fbbf24);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 40px;">
                
                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:72px;height:72px;background:linear-gradient(135deg,#f8717120,#fb923c20);border:1px solid #f8717140;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;line-height:72px;text-align:center;">
                      🔐
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h2 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">
                      Password Reset Request
                    </h2>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <p style="margin:0;color:#9ca3af;font-size:15px;line-height:1.6;max-width:400px;">
                      We received a request to reset your CollabCode password.
                      <br><br>
                      Click the button below to set a new password. If you didn't request this, you can safely ignore this email — your account remains secure.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <a href="${resetURL}"
                      style="display:inline-block;background:linear-gradient(135deg,#f87171,#fb923c);color:#000000;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                      🔑 Reset My Password
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#ffffff15,transparent);"></div>
                  </td>
                </tr>

                <!-- Warning box -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f8717108;border:1px solid #f8717130;border-radius:12px;padding:16px 20px;">
                      <tr>
                        <td>
                          <p style="margin:0;color:#fca5a5;font-size:13px;line-height:1.6;">
                            ⚠️ <strong>Security Tips:</strong><br>
                            · Never share this link with anyone<br>
                            · CollabCode will never ask for your password<br>
                            · This link can only be used once
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry note -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;color:#6b7280;font-size:12px;">
                      🕐 This link expires in <strong style="color:#f87171;">10 minutes</strong>
                    </p>
                  </td>
                </tr>

                <!-- Security note -->
                <tr>
                  <td align="center">
                    <p style="margin:0;color:#4b5563;font-size:11px;">
                      If you didn't request a password reset, please secure your account immediately.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;color:#374151;font-size:12px;">
                © 2026 <span style="color:#4ade80;">CollabCode</span> · Built for developers, by developers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log("📬 Verification email result:", JSON.stringify(result)); // 👈
};

const sendVerificationMail = async (email, VerifyToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-account/${VerifyToken}`;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: "collabcode17@gmail.com",
    name: "CollabCode",
  };
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = "Verify your CollabCode account";
  sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:#4ade80;">⚡</span>
                <span style="color:#ffffff;"> Collab</span><span style="color:#4ade80;">Code</span>
              </h1>
              <p style="margin:6px 0 0;color:#6b7280;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                Unique Coding Platform
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:20px;border:1px solid #ffffff10;overflow:hidden;">
              
              <!-- Green top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#4ade80,#22d3ee,#818cf8);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 40px;">
                
                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:72px;height:72px;background:linear-gradient(135deg,#4ade8020,#22d3ee20);border:1px solid #4ade8040;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;line-height:72px;text-align:center;">
                      ✉️
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h2 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">
                      Verify your Email
                    </h2>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <p style="margin:0;color:#9ca3af;font-size:15px;line-height:1.6;max-width:400px;">
                      Welcome to CollabCode — the platform built for real-time collaboration, session-oriented coding, and seamless developer experience.
                      <br><br>
                      Click the button below to activate your account and start your journey.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <a href="${verifyUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#4ade80,#22d3ee);color:#000000;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                      ✅ Verify My Account
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#ffffff15,transparent);"></div>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" align="center" style="padding:12px 8px;">
                          <div style="font-size:22px;margin-bottom:6px;">⚡</div>
                          <div style="color:#4ade80;font-size:12px;font-weight:600;margin-bottom:3px;">Real-time</div>
                          <div style="color:#6b7280;font-size:11px;">Live collaboration</div>
                        </td>
                        <td width="33%" align="center" style="padding:12px 8px;border-left:1px solid #ffffff08;border-right:1px solid #ffffff08;">
                          <div style="font-size:22px;margin-bottom:6px;">🔐</div>
                          <div style="color:#22d3ee;font-size:12px;font-weight:600;margin-bottom:3px;">Secure</div>
                          <div style="color:#6b7280;font-size:11px;">Session-oriented</div>
                        </td>
                        <td width="33%" align="center" style="padding:12px 8px;">
                          <div style="font-size:22px;margin-bottom:6px;">🚀</div>
                          <div style="color:#818cf8;font-size:12px;font-weight:600;margin-bottom:3px;">Powerful</div>
                          <div style="color:#6b7280;font-size:11px;">Multi-language</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry note -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;color:#6b7280;font-size:12px;">
                      🕐 This link expires in <strong style="color:#f59e0b;">24 hours</strong>
                    </p>
                  </td>
                </tr>

                <!-- Security note -->
                <tr>
                  <td align="center">
                    <p style="margin:0;color:#4b5563;font-size:11px;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;color:#374151;font-size:12px;">
                © 2026 <span style="color:#4ade80;">CollabCode</span> · Built for developers, by developers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log("📬 Verification email result:", JSON.stringify(result)); // 👈
};

module.exports = { sendResetEmail, sendVerificationMail };
