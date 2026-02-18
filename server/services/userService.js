import User from "../models/userModel.js";
import * as trustIndexService from "./trustIndexService.js";

// Maximum number of TI history entries kept per user document.
// Older entries are evicted automatically (MongoDB $slice keeps the latest N).
const TI_HISTORY_CAP = 100;

/**
 * The single point of truth for updating a user's TrustIndex and all dependent fields.
 *
 * Uses an atomic findByIdAndUpdate instead of document.save() for two reasons:
 *  1. Avoids loading / re-saving the full user document on every TI change.
 *  2. Enforces a hard cap on tiHistory via $push + $slice, preventing the
 *     embedded array from growing without bound and eventually hitting
 *     MongoDB's 16 MB document size limit.
 *
 * The in-memory `user` object is also updated so callers that read
 * user.trustIndex after this call see the correct value without a re-fetch.
 *
 * @param {object} user         - The mongoose user document (or plain object with _id).
 * @param {number} changeAmount - Delta to apply (positive = gain, negative = loss).
 * @param {string} reason       - Short description for the history entry.
 */
export async function updateTrustIndex(user, changeAmount, reason) {
  // 1. Calculate and clamp the new TrustIndex
  const newTI = trustIndexService.clampTI(user.trustIndex + changeAmount);
  const newEligibleLoan = trustIndexService.getMaxLoanLimit(newTI);

  const historyEntry = {
    value: newTI,
    change: changeAmount,
    reason: reason,
    date: new Date(),
  };

  // 2. Single atomic update:
  //    • Set scalar fields (trustIndex, eligible loan milestone)
  //    • Append the new history entry and immediately trim to the latest
  //      TI_HISTORY_CAP entries using $slice with a negative value.
  //      A negative $slice value keeps the LAST N elements, so the
  //      oldest entries are evicted automatically.
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        trustIndex: newTI,
        "milestones.eligibleLoan": newEligibleLoan,
      },
      $push: {
        tiHistory: {
          $each: [historyEntry],
          $slice: -TI_HISTORY_CAP,
        },
      },
    },
    { runValidators: false },
  );

  // 3. Keep the in-memory document consistent so callers don't need a re-fetch.
  user.trustIndex = newTI;
  user.milestones = user.milestones || {};
  user.milestones.eligibleLoan = newEligibleLoan;
}
