export type Locale = 'ru' | 'en';

const translations: Record<Locale, {
  subject: string;
  tagline: string;
  title: string;
  subtitle: string;
  greeting: string;
  body: string;
  cta: string;
  fallbackText: string;
  footer: string;
}> = {
  en: {
    subject: 'Reset your password',
    tagline: 'Doctor Wedding',
    title: 'Password Reset',
    subtitle: 'We received a request to reset your password.',
    greeting: 'Hello there,',
    body: 'Click the button below to set a new password for your <strong>Doctor Wedding</strong> account. This link is valid for <strong>24 hours</strong>.',
    cta: 'Reset my password',
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    footer: "If you didn't request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.",
  },
  ru: {
    subject: 'Сброс пароля',
    tagline: 'Doctor Wedding',
    title: 'Сброс пароля',
    subtitle: 'Мы получили запрос на сброс вашего пароля.',
    greeting: 'Привет,',
    body: 'Нажмите кнопку ниже, чтобы установить новый пароль для вашего аккаунта <strong>Doctor Wedding</strong>. Ссылка действительна <strong>24 часа</strong>.',
    cta: 'Сбросить пароль',
    fallbackText: 'Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:',
    footer: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо &mdash; ваш пароль останется прежним.',
  },
};

export const passwordResetEmailTemplate = (
  resetUrl: string,
  login: string,
  locale: Locale = 'en',
): string => {
  const t = translations[locale];

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf6f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf6f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#c9a96e 0%,#e8d5b0 100%);padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#7a5c2e;font-family:Arial,sans-serif;">${t.tagline}</p>
              <h1 style="margin:0;font-size:32px;color:#3d2b1f;font-weight:normal;line-height:1.3;">${t.title}</h1>
              <p style="margin:12px 0 0;font-size:15px;color:#6b4c30;">${t.subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#4a3728;line-height:1.7;">
                ${t.greeting}
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#4a3728;line-height:1.7;">
                ${t.body}
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#c9a96e;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:13px;color:#9a8070;line-height:1.6;font-family:Arial,sans-serif;">
                ${t.fallbackText}<br />
                <a href="${resetUrl}" style="color:#c9a96e;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fdf6f0;padding:24px 48px;border-top:1px solid #f0e4d4;">
              <p style="margin:0;font-size:12px;color:#b09c8a;line-height:1.6;font-family:Arial,sans-serif;">
                ${t.footer}
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
};

export const getPasswordResetEmailSubject = (locale: Locale = 'en'): string =>
  translations[locale].subject;