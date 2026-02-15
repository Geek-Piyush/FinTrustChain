import { Resend } from "resend";

// ── Resend Setup ──
// Uses HTTP API — works on Render, Vercel, and every platform
// (no SMTP ports needed)
let resend;
let emailEnabled = false;

function getResend() {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  RESEND_API_KEY not set — emails disabled");
    return null;
  }

  resend = new Resend(apiKey);
  emailEnabled = true;
  console.log("✅ Email service ready (Resend HTTP API)");
  return resend;
}

// Initialize on import
getResend();

// Resend free tier uses onboarding@resend.dev as the sender
// Once you verify a domain, you can use your own FROM address
const FROM_ADDRESS =
  process.env.EMAIL_FROM || "FinTrustChain <onboarding@resend.dev>";

// ── HTML wrapper shared by all email types ──
function wrapHTML(title, bodyContent) {
  const primary = "#5170ff";
  const bg = "#ffffff";
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @media (max-width: 600px) {
        .container { width: 100% !important; padding: 24px !important; }
        .btn { display: block !important; width: 100% !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:${bg};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};">
      <tr>
        <td align="center" style="padding: 32px 12px;">
          <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; background:${bg}; border:1px solid #eee; border-radius:16px; padding:32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td align="left" style="padding-bottom: 8px;">
                <div style="font-size: 18px; font-weight: 600; color: ${primary}; letter-spacing: 0.3px;">FinTrustChain</div>
              </td>
            </tr>
            ${bodyContent}
            <tr>
              <td align="center" style="padding-top: 28px; border-top: 1px solid #eee; color:#8a8a8a; font-size:12px; line-height:1.6;">
                © ${year} FinTrustChain • This is an automated message—please don't reply.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ── Core send function ──
async function sendEmail(to, subject, textBody, htmlBody) {
  if (!emailEnabled || !resend) return;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error(`❌ Email to ${to} failed:`, error.message);
      return;
    }

    console.log(`✅ Email sent to ${to} (${subject}) [${data.id}]`);
  } catch (error) {
    // Email failures should NEVER crash the app
    console.error(`❌ Email to ${to} failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════
//  Public Email Class (same API for verification)
// ═══════════════════════════════════════════════

export default class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.userName = user.name;
  }

  async sendVerificationEmail() {
    const subject = "Verify Your Email Address";
    const primary = "#5170ff";

    const body = `
      <tr>
        <td align="left" style="padding-top: 8px; padding-bottom: 12px;">
          <h1 style="margin:0; font-size: 22px; color:#545454; font-weight:700;">Verify your email</h1>
        </td>
      </tr>
      <tr>
        <td align="left" style="padding-bottom: 16px; color:#545454; font-size:15px; line-height:1.6;">
          Hi ${this.firstName},<br/>
          Please confirm this is your email for FinTrustChain. Click the button below to verify. This link will expire in <strong>10 minutes</strong>.
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 8px 0 24px 0;">
          <a href="${this.url}" class="btn" style="background:${primary}; color:#ffffff; text-decoration:none; padding:14px 22px; border-radius:10px; display:inline-block; font-weight:700; font-size:15px;">
            Verify Email
          </a>
        </td>
      </tr>
      <tr>
        <td align="left" style="padding-bottom: 16px; color:#545454; font-size:13px; line-height:1.6;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${this.url}" style="color:${primary}; word-break:break-all;">${this.url}</a>
        </td>
      </tr>`;

    const text = `Hi ${this.firstName},\n\nVerify your email: ${this.url}\n\nThis link expires in 10 minutes.`;

    await sendEmail(this.to, subject, text, wrapHTML(subject, body));
  }
}

// ═══════════════════════════════════════════════
//  Standalone notification email functions
// ═══════════════════════════════════════════════

export async function sendContractReadyEmail(user, contractId) {
  const name = user.name.split(" ")[0];
  const subject = `📝 Contract ${contractId} is ready for your signature`;

  const body = `
    <tr><td style="padding: 8px 0 12px;"><h1 style="margin:0; font-size:22px; color:#545454;">Contract Ready</h1></td></tr>
    <tr><td style="padding-bottom:16px; color:#545454; font-size:15px; line-height:1.6;">
      Hi ${name},<br/><br/>
      Contract <strong>${contractId}</strong> has been created and is waiting for your signature. Please log in to review and sign the agreement.
    </td></tr>`;

  const text = `Hi ${name}, Contract ${contractId} is ready for your signature. Please log in to review and sign.`;
  await sendEmail(user.email, subject, text, wrapHTML(subject, body));
}

export async function sendPaymentReceivedEmail(
  user,
  contractId,
  emiNumber,
  amount
) {
  const name = user.name.split(" ")[0];
  const subject = `✅ EMI #${emiNumber} payment received — ₹${amount.toLocaleString("en-IN")}`;

  const body = `
    <tr><td style="padding: 8px 0 12px;"><h1 style="margin:0; font-size:22px; color:#545454;">Payment Received</h1></td></tr>
    <tr><td style="padding-bottom:16px; color:#545454; font-size:15px; line-height:1.6;">
      Hi ${name},<br/><br/>
      EMI <strong>#${emiNumber}</strong> of <strong>₹${amount.toLocaleString("en-IN")}</strong> has been successfully received for contract <strong>${contractId || "N/A"}</strong>.
    </td></tr>`;

  const text = `Hi ${name}, EMI #${emiNumber} of ₹${amount} received for contract ${contractId}.`;
  await sendEmail(user.email, subject, text, wrapHTML(subject, body));
}

export async function sendOverdueEMIEmail(
  user,
  contractId,
  emiNumber,
  deduction,
  currentTI,
  penaltyPercent
) {
  const name = user.name.split(" ")[0];
  const subject = `⚠️ EMI #${emiNumber} is overdue — TrustIndex penalty applied`;

  const body = `
    <tr><td style="padding: 8px 0 12px;"><h1 style="margin:0; font-size:22px; color:#e53e3e;">Overdue EMI Alert</h1></td></tr>
    <tr><td style="padding-bottom:16px; color:#545454; font-size:15px; line-height:1.6;">
      Hi ${name},<br/><br/>
      Your EMI <strong>#${emiNumber}</strong> on contract <strong>${contractId || "N/A"}</strong> is overdue.<br/><br/>
      <strong>${deduction} points</strong> (${penaltyPercent}% penalty) have been deducted from your TrustIndex. Your current TrustIndex is <strong>${currentTI}</strong>.<br/><br/>
      Pay your dues as soon as possible to prevent further penalties on upcoming EMIs.
    </td></tr>`;

  const text = `Hi ${name}, EMI #${emiNumber} is overdue. ${deduction} TI points deducted (${penaltyPercent}% penalty). Current TI: ${currentTI}.`;
  await sendEmail(user.email, subject, text, wrapHTML(subject, body));
}

export async function sendLoanDefaultEmail(user, contractId, tiLoss) {
  const name = user.name.split(" ")[0];
  const subject = `🔴 Loan Default — Contract ${contractId || "N/A"}`;

  const body = `
    <tr><td style="padding: 8px 0 12px;"><h1 style="margin:0; font-size:22px; color:#e53e3e;">Loan Defaulted</h1></td></tr>
    <tr><td style="padding-bottom:16px; color:#545454; font-size:15px; line-height:1.6;">
      Hi ${name},<br/><br/>
      Contract <strong>${contractId || "N/A"}</strong> has been marked as <strong>DEFAULTED</strong>. The loan tenure has ended with unpaid EMIs remaining.<br/><br/>
      <strong>${tiLoss} points</strong> have been deducted from your TrustIndex.<br/><br/>
      If you are the guarantor on this loan, you may be liable for a portion of the outstanding balance.
    </td></tr>`;

  const text = `Hi ${name}, Contract ${contractId} has defaulted. ${tiLoss} TI points deducted.`;
  await sendEmail(user.email, subject, text, wrapHTML(subject, body));
}

export async function sendNotificationEmail(user, subject, message) {
  const name = user.name.split(" ")[0];

  const body = `
    <tr><td style="padding: 8px 0 12px;"><h1 style="margin:0; font-size:22px; color:#545454;">${subject}</h1></td></tr>
    <tr><td style="padding-bottom:16px; color:#545454; font-size:15px; line-height:1.6;">
      Hi ${name},<br/><br/>
      ${message}
    </td></tr>`;

  await sendEmail(user.email, subject, message, wrapHTML(subject, body));
}
