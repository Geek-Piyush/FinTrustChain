import phonepe from "pg-sdk-node";
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = phonepe;

import { randomUUID } from "crypto";
import Contract from "../models/contractModel.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

// --- Initialize the PhonePe Client (Singleton Pattern) ---
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
const env = Env.SANDBOX;

if (!clientId || !clientSecret || !clientVersion) {
  throw new AppError(
    "PhonePe client credentials are not configured in .env file.",
    500
  );
}

const phonepeClient = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

/**
 * Initiates a payment transaction with PhonePe.
 * @param {string} contractId - The ID of the contract.
 * @param {object} user - The user object of the person paying.
 * @param {number} [paymentAmount] - Optional: The specific amount to pay. If not provided, defaults to the contract's principal.
 * @param {string} [paymentType] - Type of payment: 'EMI' or 'DISBURSAL'. Defaults to 'EMI'.
 * @param {number} [emiNumber] - Optional: The EMI installment number being paid.
 * @returns {string} The redirect URL for the PhonePe checkout page.
 */
export async function initiatePayment(
  contractId,
  user,
  paymentAmount,
  paymentType = "EMI",
  emiNumber = null
) {
  try {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new AppError("Contract not found.", 404);
    }

    // Determine amount based on payment type
    let amountToPay;
    if (paymentType === "DISBURSAL") {
      // For disbursal, use the principal amount
      amountToPay =
        paymentAmount !== undefined ? paymentAmount : contract.principal;
    } else {
      // For EMI, use the provided amount (specific EMI) or fall back to total
      const payableAmount =
        (contract.principal * contract.interestRate) / 100 + contract.principal;
      amountToPay = paymentAmount !== undefined ? paymentAmount : payableAmount;
    }

    if (typeof amountToPay !== "number" || amountToPay <= 0) {
      throw new AppError("Invalid amount for payment.", 400);
    }

    const amountInPaisa = Math.round(amountToPay * 100);
    const uniqueSuffix = randomUUID().slice(0, 8);
    const merchantOrderId = `${paymentType}_${contractId}_${uniqueSuffix}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    let redirectUrl = `${frontendUrl}/payment-status?merchantOrderId=${merchantOrderId}&type=${paymentType}`;
    if (emiNumber !== null) {
      redirectUrl += `&emiNumber=${emiNumber}`;
    }

    const metaInfo = {
      contractId: contractId.toString(),
      payerId: user._id.toString(),
      paymentType: paymentType,
    };
    if (emiNumber !== null) {
      metaInfo.emiNumber = emiNumber.toString();
    }

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaisa)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const response = await phonepeClient.pay(request);
    return response.redirectUrl;
  } catch (error) {
    logger.error("PhonePe Payment Initiation Error", {
      message: error.message,
      httpStatusCode: error.httpStatusCode,
      data: error.data,
    });

    throw new AppError("Could not initiate payment. Please try again later.", 502);
  }
}

/**
 * Initiates a subscription payment via PhonePe.
 * @param {object} user - The authenticated user.
 * @param {string} plan - "RECEIVER" or "LENDER".
 * @param {string} duration - "BIMONTHLY" or "ANNUAL".
 * @param {number} amount - Subscription amount in INR.
 * @returns {string} The PhonePe redirect URL.
 */
export async function initiateSubscriptionPayment(user, plan, duration, amount) {
  try {
    const amountInPaisa = Math.round(amount * 100);
    const uniqueSuffix = randomUUID().slice(0, 8);
    // Pattern: SUBSCRIPTION_<PLAN>_<userId>_<suffix>
    // The demo-mode fallback in paymentController parses this to extract plan & userId.
    const merchantOrderId = `SUBSCRIPTION_${plan}_${user._id.toString()}_${uniqueSuffix}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const redirectUrl =
      `${frontendUrl}/payment-status` +
      `?merchantOrderId=${merchantOrderId}` +
      `&type=SUBSCRIPTION` +
      `&plan=${plan}` +
      `&duration=${duration}`;

    const metaInfo = {
      paymentType: "SUBSCRIPTION",
      plan,
      duration,
      userId: user._id.toString(),
    };

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaisa)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const response = await phonepeClient.pay(request);
    return response.redirectUrl;
  } catch (error) {
    logger.error("PhonePe Subscription Payment Initiation Error", {
      message: error.message,
      httpStatusCode: error.httpStatusCode,
      data: error.data,
    });
    throw new AppError(
      "Could not initiate subscription payment. Please try again later.",
      502,
    );
  }
}

// Export the initialized client so other files can use it.
export { phonepeClient };
