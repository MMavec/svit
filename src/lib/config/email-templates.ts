/**
 * Branded email templates for Supabase Authentication.
 *
 * These templates should be copied into the Supabase dashboard:
 *   Authentication > Email Templates
 *
 * Supabase template variables:
 *   {{ .ConfirmationURL }}  : Email confirmation link
 *   {{ .Token }}            : OTP token (6-digit code)
 *   {{ .RedirectTo }}       : Redirect URL after action
 *   {{ .SiteURL }}          : Your site URL configured in Supabase
 *
 * Color scheme (matches SVIT dark theme):
 *   Background:  #0a0e1a
 *   Card:        #131a2e
 *   Accent:      #63b3ed
 *   Text:        #e2e8f0
 *   Muted:       #94a3b8
 *   Success:     #68d391
 *   Warning:     #f6ad55
 */

// ---------------------------------------------------------------------------
// Shared layout wrapper
// ---------------------------------------------------------------------------

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SVIT</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 28px; font-weight: 700; color: #63b3ed; letter-spacing: 2px; text-transform: uppercase;">
                    SVIT
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; padding-top: 4px;">
                    South Vancouver Island Tracker
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #131a2e; border-radius: 12px; padding: 40px 36px; border: 1px solid rgba(99, 179, 237, 0.15);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                Real-time civic monitoring for the Capital Regional District, BC
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #475569; line-height: 1.5;">
                You received this email because an account action was initiated on SVIT.
                <br />If you did not request this, you can safely ignore this message.
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

// ---------------------------------------------------------------------------
// Button component
// ---------------------------------------------------------------------------

const emailButton = (url: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
  <tr>
    <td align="center" style="background-color: #63b3ed; border-radius: 8px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #0a0e1a; text-decoration: none; letter-spacing: 0.3px;">
        ${label}
      </a>
    </td>
  </tr>
</table>
`;

// ---------------------------------------------------------------------------
// Confirmation email
// ---------------------------------------------------------------------------

export const confirmationEmail = {
	subject: 'Welcome to SVIT: Confirm Your Email',
	fromName: 'South Vancouver Island Tracker',
	body: emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #e2e8f0;">
      Welcome to SVIT
    </h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
      Your civic dashboard for Greater Victoria is almost ready.
    </p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #e2e8f0; line-height: 1.7;">
      Thanks for signing up for the South Vancouver Island Tracker. Please confirm your
      email address to activate your account and unlock personalized features:
    </p>
    <ul style="margin: 0 0 8px; padding-left: 20px; font-size: 14px; color: #e2e8f0; line-height: 1.8;">
      <li>Custom keyword monitors across council, news, and development data</li>
      <li>Saved connections for local civic contacts</li>
      <li>Discussion threads on CRD issues</li>
      <li>Personalized dashboard layouts synced across devices</li>
    </ul>

    ${emailButton('{{ .ConfirmationURL }}', 'Confirm Email Address')}

    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
      If the button does not work, copy and paste this link into your browser:
      <br />
      <a href="{{ .ConfirmationURL }}" style="color: #63b3ed; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
  `)
};

// ---------------------------------------------------------------------------
// Password reset email
// ---------------------------------------------------------------------------

export const passwordResetEmail = {
	subject: 'SVIT: Reset Your Password',
	fromName: 'South Vancouver Island Tracker',
	body: emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #e2e8f0;">
      Reset Your Password
    </h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
      We received a request to reset your SVIT account password.
    </p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #e2e8f0; line-height: 1.7;">
      Click the button below to choose a new password. This link will expire in 24 hours.
    </p>

    ${emailButton('{{ .ConfirmationURL }}', 'Reset Password')}

    <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
      If the button does not work, copy and paste this link into your browser:
      <br />
      <a href="{{ .ConfirmationURL }}" style="color: #63b3ed; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">
      If you did not request a password reset, no action is needed. Your password will remain unchanged.
    </p>
  `)
};

// ---------------------------------------------------------------------------
// Magic link email
// ---------------------------------------------------------------------------

export const magicLinkEmail = {
	subject: 'SVIT: Your Sign-in Link',
	fromName: 'South Vancouver Island Tracker',
	body: emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #e2e8f0;">
      Sign In to SVIT
    </h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
      Use the link below to sign in to your civic dashboard.
    </p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #e2e8f0; line-height: 1.7;">
      Click the button to securely sign in. This link is single-use and will expire in 24 hours.
    </p>

    ${emailButton('{{ .ConfirmationURL }}', 'Sign In to SVIT')}

    <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
      If the button does not work, copy and paste this link into your browser:
      <br />
      <a href="{{ .ConfirmationURL }}" style="color: #63b3ed; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">
      If you did not request this link, you can safely ignore this email.
    </p>
  `)
};

// ---------------------------------------------------------------------------
// Invite email (for future admin-initiated invitations)
// ---------------------------------------------------------------------------

export const inviteEmail = {
	subject: 'You Have Been Invited to SVIT',
	fromName: 'South Vancouver Island Tracker',
	body: emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #e2e8f0;">
      You Are Invited
    </h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
      Someone has invited you to join the South Vancouver Island Tracker.
    </p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #e2e8f0; line-height: 1.7;">
      SVIT is a real-time civic monitoring dashboard for the Capital Regional District
      in Greater Victoria, BC. Accept your invitation to get started with personalized
      monitors, saved connections, and discussion threads.
    </p>

    ${emailButton('{{ .ConfirmationURL }}', 'Accept Invitation')}

    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
      If the button does not work, copy and paste this link into your browser:
      <br />
      <a href="{{ .ConfirmationURL }}" style="color: #63b3ed; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
  `)
};

// ---------------------------------------------------------------------------
// Export lookup for programmatic use
// ---------------------------------------------------------------------------

export const emailTemplates = {
	confirmation: confirmationEmail,
	passwordReset: passwordResetEmail,
	magicLink: magicLinkEmail,
	invite: inviteEmail
} as const;
