export const confirmationEmailTemplate = (confirmUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your account</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; color: #333; margin-bottom: 16px; }
    p { color: #555; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { margin-top: 32px; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You've been invited!</h1>
    <p>You have been invited to join the wedding planning app. Click the button below to confirm your account and get started.</p>
    <a class="btn" href="${confirmUrl}">Confirm my account</a>
    <p style="margin-top: 16px; font-size: 13px;">Or copy this link into your browser:<br /><a href="${confirmUrl}">${confirmUrl}</a></p>
    <div class="footer">This link expires in 24 hours. If you did not expect this invitation, you can ignore this email.</div>
  </div>
</body>
</html>
`;