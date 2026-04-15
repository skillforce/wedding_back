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
    subject: 'Confirm your email',
    tagline: "You're invited",
    title: 'Welcome to Doctor Wedding',
    subtitle: 'Your wedding preparation starts here.',
    greeting: 'Hello there,',
    body: "You've been invited to <strong>Doctor Wedding</strong> &mdash; your personal space for making wedding preparation more convenient and stress&#8209;free. To get started, please confirm your email address by clicking the button below.",
    cta: 'Confirm my email',
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    footer: 'This link expires in <strong>24 hours</strong>. If you weren&rsquo;t expecting this invitation, you can safely ignore this email &mdash; no action is needed.',
  },
  ru: {
    subject: 'Подтвердите вашу почту',
    tagline: 'Вы приглашены',
    title: 'Добро пожаловать в Doctor Wedding',
    subtitle: 'Ваша подготовка к свадьбе начинается здесь.',
    greeting: 'Привет,',
    body: 'Вы были приглашены в <strong>Doctor Wedding</strong> &mdash; ваше личное пространство для удобной и комфортной подготовки к свадьбе. Чтобы начать, подтвердите свой адрес электронной почты, нажав кнопку ниже.',
    cta: 'Подтвердить почту',
    fallbackText: 'Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:',
    footer: 'Ссылка действительна <strong>24 часа</strong>. Если вы не ожидали этого приглашения, просто проигнорируйте письмо &mdash; никаких действий не требуется.',
  },
};

export const confirmationEmailTemplate = (confirmUrl: string, locale: Locale = 'en'): string => {
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
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:13px;color:#9a8070;line-height:1.6;font-family:Arial,sans-serif;">
                ${t.fallbackText}<br />
                <a href="${confirmUrl}" style="color:#c9a96e;word-break:break-all;">${confirmUrl}</a>
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

export const getConfirmationEmailSubject = (locale: Locale = 'en'): string =>
  translations[locale].subject;