import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";

/**
 * Creates and saves a new notification for a specific user.
 *
 * @param {object|string} user    - Full user document or plain user ID.
 * @param {string}        message - Notification text displayed in the inbox.
 * @param {string}        [link]  - Optional relative URL for frontend routing.
 */
export async function createNotification(user, message, link) {
  try {
    const userId = user._id || user;
    await Notification.create({ user: userId, message, link });
  } catch (error) {
    logger.error(
      `Failed to create notification for user ${user._id || user}:`,
      error,
    );
  }
}

/**
 * Builds and dispatches all notifications for a contract lifecycle event.
 *
 * This function is intentionally NOT called inside a Mongoose post-save hook.
 * Calling it from a hook would block every contract.save() behind a populate()
 * and up to 3 Notification.create() writes, adding latency to every status
 * transition visible to the end user.
 *
 * Instead, call this from the service/controller layer using setImmediate so
 * the HTTP response is sent first and the notifications are written
 * asynchronously in the next event-loop iteration.
 *
 * Usage:
 *   setImmediate(() => dispatchContractNotifications(contractDoc, "CREATED"));
 *
 * @param {object} contractDoc - A Mongoose contract document (may be unpopulated).
 * @param {"CREATED"|"AWAITING_DISBURSAL"|"AWAITING_RECEIPT_CONFIRMATION"|"ACTIVE"|"REPAID"|"DEFAULT"} event
 */
export async function dispatchContractNotifications(contractDoc, event) {
  try {
    // Populate only the fields we need for message construction.
    // If the doc already has populated sub-documents we skip the DB round-trip.
    let lender = contractDoc.lender;
    let receiver = contractDoc.receiver;
    let guarantor = contractDoc.guarantor;

    const needsPopulate =
      !lender?.name ||
      !receiver?.name ||
      (contractDoc.guarantor && !guarantor?.name);

    if (needsPopulate) {
      const populated = await contractDoc.populate(
        "lender receiver guarantor",
        "name email",
      );
      lender = populated.lender;
      receiver = populated.receiver;
      guarantor = populated.guarantor;
    }

    const link = `/contracts/${contractDoc._id}`;
    let notifications = [];

    switch (event) {
      case "CREATED":
        notifications = [
          createNotification(
            lender,
            `The loan contract for ${receiver.name} is ready for your signature.`,
            link,
          ),
          createNotification(
            receiver,
            `The loan contract for ${receiver.name} is ready for your signature.`,
            link,
          ),
          createNotification(
            guarantor,
            `The contract for ${receiver.name}, which you guaranteed, is ready for your signature.`,
            link,
          ),
        ];
        break;

      case "AWAITING_DISBURSAL":
        notifications = [
          createNotification(
            lender,
            `Contract with ${receiver.name} is fully signed. Please disburse the funds and confirm.`,
            link,
          ),
        ];
        break;

      case "AWAITING_RECEIPT_CONFIRMATION":
        notifications = [
          createNotification(
            receiver,
            `Lender ${lender.name} has confirmed payment. Please confirm receipt within 24 hours.`,
            `${link}/disbursal-proof`,
          ),
        ];
        break;

      case "ACTIVE":
        notifications = [
          createNotification(
            receiver,
            `Your loan with ${lender.name} is now active!`,
            link,
          ),
          createNotification(
            lender,
            `The loan to ${receiver.name} is now active.`,
            link,
          ),
          createNotification(
            guarantor,
            `The loan for ${receiver.name} that you guaranteed is now active.`,
            link,
          ),
        ];
        break;

      case "REPAID":
        notifications = [
          createNotification(
            lender,
            `Congratulations! The loan to ${receiver.name} has been fully repaid.`,
            link,
          ),
          createNotification(
            receiver,
            `You have successfully repaid your loan from ${lender.name}. Your TrustIndex has increased!`,
            link,
          ),
          createNotification(
            guarantor,
            `Good news! The loan for ${receiver.name} has been repaid. Your TrustIndex has increased.`,
            link,
          ),
        ];
        break;

      case "DEFAULT": {
        const liabilityAmount =
          contractDoc.guarantorLiabilityAmount ||
          Math.round(contractDoc.principal * 0.5);
        notifications = [
          createNotification(
            lender,
            `Urgent: The loan to ${receiver.name} has defaulted.`,
            link,
          ),
          createNotification(
            receiver,
            `Your loan from ${lender.name} has defaulted. Your TrustIndex has been severely impacted.`,
            `/debts`,
          ),
          createNotification(
            guarantor,
            `URGENT: The loan for ${receiver.name} has defaulted. You are liable for ₹${liabilityAmount.toLocaleString("en-IN")}. Pay now to settle your liability.`,
            `/debts`,
          ),
        ];
        break;
      }

      default:
        logger.warn(`dispatchContractNotifications: unknown event "${event}"`);
        return;
    }

    const results = await Promise.allSettled(notifications);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        logger.error(
          `Contract notification [${event}] #${i} failed:`,
          r.reason,
        );
      }
    });
  } catch (error) {
    logger.error(
      `dispatchContractNotifications failed for contract ${contractDoc._id} event "${event}":`,
      error,
    );
  }
}
