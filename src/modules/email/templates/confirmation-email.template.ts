export const confirmationEmailTemplate = (confirmUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited!</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf6f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf6f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#c9a96e 0%,#e8d5b0 100%);padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#7a5c2e;font-family:Arial,sans-serif;">You're invited</p>
              <h1 style="margin:0;font-size:32px;color:#3d2b1f;font-weight:normal;line-height:1.3;">Together We Celebrate</h1>
              <p style="margin:12px 0 0;font-size:15px;color:#6b4c30;">A special day is coming &mdash; and you&rsquo;re on the list.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#4a3728;line-height:1.7;">
                Hello there,
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#4a3728;line-height:1.7;">
                You have been invited to join our wedding planning app. To confirm your account and unlock your personal wedding details, simply click the button below.
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#4a3728;line-height:1.7;">
                We&rsquo;re so glad you&rsquo;re with us for this journey.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#c9a96e;border-radius:8px;">
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      Confirm my account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:13px;color:#9a8070;line-height:1.6;font-family:Arial,sans-serif;">
                If the button doesn&rsquo;t work, copy and paste this link into your browser:<br />
                <a href="${confirmUrl}" style="color:#c9a96e;word-break:break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fdf6f0;padding:24px 48px;border-top:1px solid #f0e4d4;">
              <p style="margin:0;font-size:12px;color:#b09c8a;line-height:1.6;font-family:Arial,sans-serif;">
                This link expires in <strong>24 hours</strong>. If you weren&rsquo;t expecting this invitation, you can safely ignore this email &mdash; no action is needed.
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