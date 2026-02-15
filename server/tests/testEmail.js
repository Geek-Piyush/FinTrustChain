/**
 * =====================================================
 * Nodemailer + Gmail Test Script
 * =====================================================
 *
 * BEFORE RUNNING THIS TEST:
 *
 * 1. Go to https://myaccount.google.com/security
 * 2. Enable "2-Step Verification" (required for App Passwords)
 * 3. Go to https://myaccount.google.com/apppasswords
 * 4. Create an App Password:
 *    - App name: "FinTrustChain"
 *    - Google will give you a 16-character password like "abcd efgh ijkl mnop"
 * 5. Add these to your .env file:
 *
 *    GMAIL_USER=your_gmail@gmail.com
 *    GMAIL_APP_PASSWORD=abcdefghijklmnop    (no spaces)
 *
 * RUN:  node tests/testEmail.js
 * =====================================================
 */

import "dotenv/config";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// ── Step 1: Check env vars ──
console.log("\n🔍 Step 1: Checking environment variables...");
if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error("❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env");
  console.error("   Add these to your server/.env file:");
  console.error("   GMAIL_USER=your_gmail@gmail.com");
  console.error(
    "   GMAIL_APP_PASSWORD=your_16_char_app_password  (no spaces)"
  );
  process.exit(1);
}
console.log(`  ✅ GMAIL_USER = ${GMAIL_USER}`);
console.log(
  `  ✅ GMAIL_APP_PASSWORD = ${"*".repeat(GMAIL_APP_PASSWORD.length)} (${GMAIL_APP_PASSWORD.length} chars)`
);

// ── Step 2: Create transporter ──
console.log("\n🔧 Step 2: Creating Nodemailer transporter...");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

// ── Step 3: Verify connection ──
console.log("\n🔗 Step 3: Verifying SMTP connection...");
try {
  await transporter.verify();
  console.log("  ✅ SMTP connection verified! Gmail is ready to send emails.");
} catch (error) {
  console.error("  ❌ SMTP verification failed:");
  console.error(`     ${error.message}`);
  if (error.message.includes("Invalid login")) {
    console.error("\n   💡 Possible fixes:");
    console.error(
      "   - Make sure 2-Step Verification is enabled on your Google account"
    );
    console.error(
      "   - Generate an App Password at https://myaccount.google.com/apppasswords"
    );
    console.error(
      "   - Use the App Password (NOT your Google account password)"
    );
    console.error("   - Remove any spaces from the App Password in .env");
  }
  process.exit(1);
}

// ── Step 4: Send test email ──
console.log("\n📧 Step 4: Sending test email...");
const testHTML = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #eee;">
  <div style="font-size: 18px; font-weight: 600; color: #5170ff; margin-bottom: 16px;">FinTrustChain</div>
  <h2 style="color: #333; margin: 0 0 12px 0;">✅ Email Test Successful!</h2>
  <p style="color: #545454; line-height: 1.6; font-size: 15px;">
    If you're reading this, Nodemailer + Gmail integration is working correctly.
  </p>
  <p style="color: #545454; line-height: 1.6; font-size: 15px;">
    <strong>Sent at:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #8a8a8a; font-size: 12px; text-align: center;">
    © ${new Date().getFullYear()} FinTrustChain • Test Email
  </p>
</div>`;

try {
  const info = await transporter.sendMail({
    from: `"FinTrustChain" <${GMAIL_USER}>`,
    to: GMAIL_USER, // Send to yourself
    subject: "🧪 FinTrustChain - Nodemailer Test",
    text: "If you see this, Nodemailer + Gmail is working!",
    html: testHTML,
  });

  console.log("  ✅ Test email sent successfully!");
  console.log(`     Message ID: ${info.messageId}`);
  console.log(`     Sent to: ${GMAIL_USER}`);
  console.log("\n🎉 All tests passed! Check your inbox (and spam folder).\n");
} catch (error) {
  console.error("  ❌ Failed to send test email:");
  console.error(`     ${error.message}`);
  process.exit(1);
}
