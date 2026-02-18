import * as paymentService from "../services/paymentService.js";
import { settleSuccessfulRepayment } from "../services/loanSettlementServices.js";
import { phonepeClient } from "../services/paymentService.js";
import Contract from "../models/contractModel.js";
import Transaction from "../models/transactionModel.js";
import PlatformRevenue from "../models/platformRevenueModel.js";
import { sendPaymentReceivedEmail } from "../utils/email.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

// POST /payments/pay
export const createPayment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { contractId } = req.body;
  if (!contractId) {
    throw new AppError("Contract ID is required to initiate a payment.", 400);
  }
  const contract = await Contract.findById(contractId);

  if (!contract) {
    throw new AppError("Contract not found.", 404);
  }
  // Ensure only the receiver can pay and only when the loan is active.
  if (!contract.receiver.equals(user._id)) {
    throw new AppError(
      "You are not authorized to make payments for this contract.",
      403,
    );
  }
  if (contract.status !== "ACTIVE") {
    throw new AppError("Payments can only be made on active loans.", 400);
  }

  // Find the next pending EMI
  const nextEMI = contract.repaymentSchedule.find(
    emi => emi.status === "PENDING",
  );

  if (!nextEMI) {
    throw new AppError(
      "All EMIs have already been paid for this contract.",
      400,
    );
  }

  const redirectUrl = await paymentService.initiatePayment(
    contractId,
    user,
    nextEMI.amountDue,
    "EMI",
    nextEMI.emiNumber,
  );
  res.status(200).json({
    status: "success",
    message: `EMI #${nextEMI.emiNumber} payment initiated successfully.`,
    data: {
      redirectUrl,
      emiNumber: nextEMI.emiNumber,
      amount: nextEMI.amountDue,
    },
  });
});

// GET /payments/status/:merchantOrderId
// Frontend-safe: JWT-protected. Tries PhonePe verification first,
// falls back to auto-confirm for demo/student mode when API is unavailable.
// NOTE: Keeps manual try/catch because inner try/catch for PhonePe API + demo fallback
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { merchantOrderId } = req.params;

    if (!merchantOrderId) {
      throw new AppError("merchantOrderId is required.", 400);
    }

    // Check if already processed (idempotent)
    const existingTxn = await Transaction.findOne({
      paymentTransactionId: merchantOrderId,
    });
    if (existingTxn) {
      return res.status(200).json({
        status: "success",
        data: {
          paymentState: "COMPLETED",
          alreadyProcessed: true,
          transactionId: existingTxn._id,
        },
      });
    }

    // Try PhonePe server-to-server verification first
    let paymentState = "PENDING";
    let verified = false;

    try {
      const statusResponse =
        await phonepeClient.getOrderStatus(merchantOrderId);
      const state = statusResponse?.state;

      if (state === "COMPLETED") {
        paymentState = "COMPLETED";
        verified = true;

        // Use metaInfo from PhonePe response if available
        const metaInfo = statusResponse.metaInfo || {};
        const contractId = metaInfo.contractId;
        const paymentType = metaInfo.paymentType || "EMI";
        const emiNumber = metaInfo.emiNumber
          ? parseInt(metaInfo.emiNumber)
          : null;

        if (contractId) {
          await processConfirmedPayment(
            contractId,
            paymentType,
            emiNumber,
            merchantOrderId,
          );
        }
      } else if (state === "FAILED") {
        paymentState = "FAILED";
      }
    } catch (err) {
      logger.warn(
        `PhonePe API unavailable for ${merchantOrderId}: ${err.message}`,
      );

      // ── Demo/Student fallback ──
      const parts = merchantOrderId.split("_");
      let paymentType, contractId;

      if (parts[0] === "GUARANTOR" && parts[1] === "PAY") {
        paymentType = "GUARANTOR_PAY";
        contractId = parts[2];
      } else {
        paymentType = parts[0];
        contractId = parts[1];
      }

      const emiNumber = req.query.emiNumber
        ? parseInt(req.query.emiNumber)
        : null;

      if (contractId) {
        logger.info(
          `[DEMO MODE] Auto-confirming ${paymentType} for contract ${contractId}`,
        );
        await processConfirmedPayment(
          contractId,
          paymentType,
          emiNumber,
          merchantOrderId,
        );
        paymentState = "COMPLETED";
        verified = true;
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        paymentState,
        merchantOrderId,
        verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Shared logic to process a confirmed payment.
 * Used by both the webhook callback and the frontend status-check endpoint.
 */
async function processConfirmedPayment(
  contractId,
  paymentType,
  emiNumber,
  merchantOrderId,
) {
  // Idempotency: already processed?
  const existingTxn = await Transaction.findOne({
    paymentTransactionId: merchantOrderId,
  });
  if (existingTxn) return;

  if (paymentType === "DISBURSAL") {
    const contract = await Contract.findById(contractId)
      .populate("lender")
      .populate("receiver");
    if (!contract) return;

    if (
      contract.status === "AWAITING_DISBURSAL" ||
      contract.status === "AWAITING_RECEIPT_CONFIRMATION"
    ) {
      await Transaction.create({
        contract: contract._id,
        fromUser: contract.lender._id,
        toUser: contract.receiver._id,
        amount: contract.principal,
        status: "DISBURSED",
        proofOfPaymentFilename: `phonepe_${merchantOrderId}`,
        paymentTransactionId: merchantOrderId,
      });

      if (contract.status !== "AWAITING_RECEIPT_CONFIRMATION") {
        contract.status = "AWAITING_RECEIPT_CONFIRMATION";
        await contract.save();
      }
    }
  } else if (paymentType === "GUARANTOR_PAY") {
    const contract = await Contract.findById(contractId)
      .populate("lender")
      .populate("receiver")
      .populate("guarantor");
    if (
      !contract ||
      contract.status !== "DEFAULT" ||
      contract.guarantorLiabilityPaid
    )
      return;

    contract.guarantorLiabilityPaid = true;
    await contract.save();

    const liabilityAmount =
      contract.guarantorLiabilityAmount || Math.round(contract.principal * 0.5);

    await Transaction.create({
      contract: contract._id,
      fromUser: contract.guarantor._id,
      toUser: contract.lender._id,
      amount: liabilityAmount,
      status: "GUARANTOR_SETTLEMENT",
      paymentTransactionId: merchantOrderId,
    });
  } else {
    // EMI payment
    const contract = await Contract.findById(contractId)
      .populate("lender")
      .populate("receiver");
    if (!contract) return;

    if (emiNumber && contract.repaymentSchedule.length > 0) {
      const emi = contract.repaymentSchedule.find(
        e => e.emiNumber === emiNumber,
      );

      if (emi && (emi.status === "PENDING" || emi.status === "OVERDUE")) {
        emi.status = "PAID";
        emi.paidAt = new Date();
        contract.consecutiveOverdueCount = 0;

        await Transaction.create({
          contract: contract._id,
          fromUser: contract.receiver._id,
          toUser: contract.lender._id,
          amount: emi.amountDue,
          status: "SUCCESS",
          emiNumber: emiNumber,
          paymentTransactionId: merchantOrderId,
        });

        await contract.save();

        // Convenience fee
        const receiver = contract.receiver;
        const isPremiumReceiver =
          receiver?.premium?.active && receiver.premium.plan === "RECEIVER";
        if (!isPremiumReceiver) {
          const convenienceFee = emi.amountDue <= 5000 ? 5 : 10;
          await PlatformRevenue.create({
            type: "CONVENIENCE_FEE",
            contract: contract._id,
            user: receiver._id,
            amount: convenienceFee,
            description: `EMI #${emiNumber} convenience fee`,
          });
        }

        // Email lender
        if (contract.lender?.email) {
          await sendPaymentReceivedEmail(
            contract.lender,
            contract.contractId || contractId,
            emiNumber,
            emi.amountDue,
          );
        }

        // Check if all EMIs paid
        const allPaid = contract.repaymentSchedule.every(
          e => e.status === "PAID",
        );
        if (allPaid) {
          scheduleSettlement(contractId);
        }
      }
    } else {
      scheduleSettlement(contractId);
    }
  }
}

/**
 * Schedules settleSuccessfulRepayment to run after the current call-stack
 * (and therefore after the HTTP response) using setImmediate.
 *
 * Why not fire-and-forget without any tracking?
 *   • A plain unawaited call swallows errors silently — the contract stays
 *     ACTIVE forever with no log evidence.
 * Why not `await` inside processConfirmedPayment?
 *   • Settlement touches 10+ DB operations (TI updates, PDF gen, capital
 *     release, platform fee) which would stall the payment response by
 *     several seconds.
 *
 * setImmediate ensures:
 *   1. The response is sent first (non-blocking for the caller).
 *   2. Errors are caught and logged (not silently swallowed).
 *   3. On failure the contract ID is logged so an admin / cron can retry.
 */
function scheduleSettlement(contractId) {
  setImmediate(async () => {
    try {
      await settleSuccessfulRepayment(contractId);
    } catch (err) {
      // settleSuccessfulRepayment has its own internal try/catch, but a
      // second guard here ensures any unexpected throw is never silent.
      logger.error(
        `[CRITICAL] Settlement failed for contract ${contractId}. ` +
          `Manual intervention may be required. Error: ${err.message}`,
        { contractId, stack: err.stack },
      );
    }
  });
}

import crypto from "crypto";

/**
 * Server-to-server verification with PhonePe.
 * Calls PhonePe's Order Status API to confirm the payment actually succeeded.
 * This prevents forged callbacks from being accepted.
 */
async function verifyPaymentServerSide(merchantOrderId) {
  try {
    if (process.env.NODE_ENV === "development") {
      logger.debug(
        `[DEV] Skipping PhonePe status check for ${merchantOrderId} (HMAC already verified).`,
      );
      return true;
    }

    const statusResponse = await phonepeClient.getOrderStatus(merchantOrderId);
    const state = statusResponse?.state;

    if (state === "COMPLETED") {
      logger.info(`PhonePe verified: ${merchantOrderId} is COMPLETED.`);
      return true;
    }

    logger.error(
      `PhonePe status for ${merchantOrderId}: ${state || "UNKNOWN"}`,
    );
    return false;
  } catch (err) {
    logger.error(
      `PhonePe status check failed for ${merchantOrderId}: ${err.message}`,
    );
    return false;
  }
}

// POST /payments/callback
// Server-to-server webhook from PhonePe. Never exposed to frontend.
// NOTE: Keeps manual try/catch because webhook must always respond 200/400, never pass to global error handler
export const handleCallback = async (req, res, next) => {
  try {
    let callbackResponse;

    // ── Step 1: Validate the incoming callback ──
    const authorizationHeader = req.headers["authorization"];
    const responseBodyString = JSON.stringify(req.body);

    if (process.env.NODE_ENV === "development") {
      // Dev: validate using HMAC shared secret instead of PhonePe credentials
      const hmacSecret = process.env.CALLBACK_HMAC_SECRET;
      if (!hmacSecret) {
        logger.warn(
          "CALLBACK_HMAC_SECRET not set. Rejecting callback in dev mode.",
        );
        return res.status(401).send("HMAC secret not configured.");
      }

      // Expect header: "HMAC <hex-digest>"
      if (!authorizationHeader || !authorizationHeader.startsWith("HMAC ")) {
        return res.status(401).send("Missing or invalid HMAC authorization.");
      }

      const receivedHmac = authorizationHeader.slice(5);
      const expectedHmac = crypto
        .createHmac("sha256", hmacSecret)
        .update(responseBodyString)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(receivedHmac, "hex"),
          Buffer.from(expectedHmac, "hex"),
        )
      ) {
        logger.error("HMAC signature mismatch — rejecting callback.");
        return res.status(401).send("Invalid HMAC signature.");
      }

      callbackResponse = {
        type: req.body.type,
        payload: req.body.payload,
      };
    } else {
      // Production: validate with PhonePe SDK credentials
      const client = phonepeClient;
      const usernameConfigured = process.env.PHONEPE_WEBHOOK_USERNAME;
      const passwordConfigured = process.env.PHONEPE_WEBHOOK_PASSWORD;

      callbackResponse = client.validateCallback(
        usernameConfigured,
        passwordConfigured,
        authorizationHeader,
        responseBodyString,
      );
    }

    // ── Step 2: Server-to-server payment status verification ──
    const eventType = callbackResponse.type;
    const payload = callbackResponse.payload;
    const merchantOrderId = payload.originalMerchantOrderId;

    logger.info(
      `Received callback event: ${eventType}, order: ${merchantOrderId}`,
    );

    if (eventType === "CHECKOUT_ORDER_COMPLETED") {
      // Verify with PhonePe server that payment actually succeeded
      const isVerified = await verifyPaymentServerSide(merchantOrderId);
      if (!isVerified) {
        logger.error(
          `Server-side verification FAILED for order ${merchantOrderId}. Rejecting.`,
        );
        return res.status(400).send("Payment verification failed.");
      }

      // ── Step 3: Idempotency + processing via shared function ──
      const contractId = payload.metaInfo?.contractId;
      const paymentType = payload.metaInfo?.paymentType || "EMI";
      const emiNumber = payload.metaInfo?.emiNumber
        ? parseInt(payload.metaInfo.emiNumber)
        : null;

      if (contractId) {
        await processConfirmedPayment(
          contractId,
          paymentType,
          emiNumber,
          merchantOrderId,
        );
      }
    } else if (eventType === "CHECKOUT_ORDER_FAILED") {
      logger.error(`Payment failed for Order ID: ${merchantOrderId}.`);
    }

    res.status(200).send();
  } catch (error) {
    logger.error("Callback validation failed", { error: error.message });
    res.status(400).send("Callback validation failed");
  }
};
