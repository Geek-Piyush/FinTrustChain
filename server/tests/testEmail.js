/**
 * =====================================================
 * Resend Email Test Script
 * =====================================================
 *
 * BEFORE RUNNING THIS TEST:
 *
 * 1. Sign up at https://resend.com (free — 3,000 emails/month)
 * 2. Go to https://resend.com/api-keys → Create API Key
 * 3. Add to your .env file:
 *
 *    RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * RUN:  node tests/testEmail.js
 * =====================================================
 */

import "dotenv/config";
import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;

// ── Step 1: Check env vars ──
console.log("\n🔍 Step 1: Checking environment variables...");
if (!API_KEY) {
  console.error("❌ Missing RESEND_API_KEY in .env");
  console.error("   Sign up at https://resend.com and create an API key");
  console.error("   Then add to .env: RESEND_API_KEY=re_xxxxx");
  process.exit(1);
}
console.log(
  `  ✅ RESEND_API_KEY = ${API_KEY.slice(0, 6)}...${"*".repeat(10)} (${API_KEY.length} chars)`
);

// ── Step 2: Create client ──
console.log("\n🔧 Step 2: Creating Resend client...");
const resend = new Resend(API_KEY);
console.log("  ✅ Resend client initialized (HTTP API — no SMTP needed)");

// ── Step 3: Send test email ──
console.log("\n📧 Step 3: Sending test email...");

const testHTML = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #eee;">
  <div style="font-size: 18px; font-weight: 600; color: #5170ff; margin-bottom: 16px;">FinTrustChain</div>
  <h2 style="color: #333; margin: 0 0 12px 0;">✅ Resend Email Test Successful!</h2>
  <p style="color: #545454; line-height: 1.6; font-size: 15px;">
    If you're reading this, the Resend HTTP API integration is working correctly.
    This will work both locally AND on Render.
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
  const { data, error } = await resend.emails.send({
    from: "FinTrustChain <onboarding@resend.dev>",
    to: [process.env.GMAIL_USER || "test@example.com"],
    subject: "🧪 FinTrustChain - Resend Test",
    text: "If you see this, Resend HTTP API is working!",
    html: testHTML,
  });

  if (error) {
    console.error("  ❌ Resend returned an error:");
    console.error(`     ${error.message}`);
    process.exit(1);
  }

  console.log("  ✅ Test email sent successfully!");
  console.log(`     Email ID: ${data.id}`);
  console.log(
    `     Sent to: ${process.env.GMAIL_USER || "test@example.com"}`
  );
  console.log("\n🎉 All tests passed! Check your inbox (and spam folder).\n");
  console.log(
    "   NOTE: On Resend's free tier, the sender is onboarding@resend.dev"
  );
  console.log(
    "   To use your own domain, verify it at https://resend.com/domains\n"
  );
} catch (error) {
  console.error("  ❌ Failed to send test email:");
  console.error(`     ${error.message}`);
  process.exit(1);
}
