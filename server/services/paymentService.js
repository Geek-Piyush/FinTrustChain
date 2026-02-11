import phonepe from "pg-sdk-node";
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = phonepe;

import { randomUUID } from "crypto";
import Contract from "../models/contractModel.js";

// --- Initialize the PhonePe Client (Singleton Pattern) ---
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
const env = Env.SANDBOX;

if (!clientId || !clientSecret || !clientVersion) {
  throw new Error(
    "PhonePe client credentials are not configured in .env file."
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
      throw new Error("Contract not found.");
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
      throw new Error("Invalid amount for payment.");
    }

    const amountInPaisa = Math.round(amountToPay * 100);
    const uniqueSuffix = randomUUID().slice(0, 8);
    const merchantOrderId = `${paymentType}_${contractId}_${uniqueSuffix}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const redirectUrl = `${frontendUrl}/payment-status?merchantOrderId=${merchantOrderId}&type=${paymentType}`;

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
    console.error("PhonePe Payment Initiation Error:", {
      message: error.message,
      httpStatusCode: error.httpStatusCode,
      data: error.data,
    });

    throw new Error("Could not initiate payment. Please try again later.");
  }
}

// Export the initialized client so other files can use it.
export { phonepeClient };
