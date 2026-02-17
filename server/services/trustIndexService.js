// --- Configuration Data Tables ---

// Alpha and Beta values for calculating TI gain/loss from loan activities.
const ALPHA_BETA_VALUES = [
  { range: [0, 400], alpha: 0.05, beta: 0.01 },
  { range: [400, 500], alpha: 0.15, beta: 0.02 },
  { range: [500, 600], alpha: 0.12, beta: 0.05 },
  { range: [600, 750], alpha: 0.1, beta: 0.08 },
  { range: [750, 850], alpha: 0.08, beta: 0.1 },
  { range: [850, 900], alpha: 0.05, beta: 0.12 },
  { range: [900, 950], alpha: 0.02, beta: 0.15 },
];

// TI gain/loss values for initial endorsement and removal.
const ENDORSEMENT_TIERS = [
  { range: [0, 400], gain: 20, loss: 5 },
  { range: [400, 500], gain: 20, loss: 5 },
  { range: [500, 600], gain: 15, loss: 8 },
  { range: [600, 750], gain: 10, loss: 10 },
  { range: [750, 850], gain: 8, loss: 15 },
  { range: [850, 900], gain: 5, loss: 20 },
  { range: [900, 950], gain: 2, loss: 30 },
];

// Loan eligibility limits based on a user's TrustIndex.
const LOAN_LIMITS = [
  { range: [0, 400], limit: 500 },
  { range: [400, 500], limit: 1000 },
  { range: [500, 600], limit: 2000 },
  { range: [600, 750], limit: 5000 },
  { range: [750, 850], limit: 10000 },
  { range: [850, 900], limit: 15000 },
  { range: [900, 950], limit: 20000 },
];

// --- Utility Functions ---

/**
 * Ensures a TrustIndex value stays within the valid 0-950 range.
 * @param {number} ti - The TrustIndex value.
 * @returns {number} The clamped TrustIndex value.
 */
export function clampTI(ti) {
  return Math.min(Math.max(ti, 0), 950);
}

/**
 * Finds the corresponding Alpha and Beta values for a given TrustIndex.
 * @param {number} ti - The user's current TrustIndex.
 * @returns {{alpha: number, beta: number}}
 */
function getAlphaBeta(ti) {
  if (ti >= 950)
    return {
      alpha: 0,
      beta: ALPHA_BETA_VALUES[ALPHA_BETA_VALUES.length - 1].beta,
    };
  if (ti <= 0) return { alpha: ALPHA_BETA_VALUES[0].alpha, beta: 0 };
  return (
    ALPHA_BETA_VALUES.find((t) => ti >= t.range[0] && ti < t.range[1]) || {
      alpha: 0,
      beta: 0,
    }
  );
}

// --- Core Service Functions ---

/**
 * Calculates the TI gain for being endorsed.
 * @param {number} currentTI - The current TrustIndex of the user.
 * @returns {number} The TI gain amount.
 */
export function getInitialEndorsementGain(currentTI) {
  if (currentTI >= 950) return 0;
  const tier = ENDORSEMENT_TIERS.find(
    (t) => currentTI >= t.range[0] && currentTI < t.range[1]
  );
  return tier ? tier.gain : 0;
}

/**
 * Calculates the TI loss for having an endorsement removed.
 * @param {number} currentTI - The current TrustIndex of the user.
 * @returns {number} The TI loss amount.
 */
export function getInitialEndorsementLoss(currentTI) {
  if (currentTI <= 0) return 0;
  const tier = ENDORSEMENT_TIERS.find(
    (t) => currentTI >= t.range[0] && currentTI < t.range[1]
  );
  const loss = tier ? tier.loss : 0;
  // Ensure loss doesn't drop TI below 0
  return Math.min(loss, currentTI);
}

/**
 * Calculates the TI gain for a receiver who repays a loan.
 * @param {number} currentTI - The receiver's current TrustIndex.
 * @param {number} loanAmount - The principal amount of the loan.
 * @param {number} daysEarly - How many days early the final payment was made.
 * @param {number} repaymentPeriod - The total tenor of the loan in days.
 * @returns {number} The net TI gain.
 */
export function getLoanRepaymentGain(
  currentTI,
  loanAmount,
  daysEarly,
  repaymentPeriod
) {
  const { alpha } = getAlphaBeta(currentTI);
  const baseGain = (alpha * (950 - currentTI)) / 4;
  const timelinessBonus = (daysEarly / repaymentPeriod) * 2;
  const amountFactor = 1 + loanAmount / 40000;

  const totalGain = Math.floor(baseGain + timelinessBonus + amountFactor);
  // Return the net gain, not the new total TI
  return clampTI(currentTI + totalGain) - currentTI;
}

/**
 * Calculates the TI loss for a receiver who defaults on a loan.
 * @param {number} currentTI - The receiver's current TrustIndex.
 * @param {number} loanAmount - The principal amount of the loan.
 * @param {number} daysLate - How many days late the payment is.
 * @returns {number} The total TI loss.
 */
export function getLoanDefaultLoss(currentTI, loanAmount, daysLate) {
  const { beta } = getAlphaBeta(currentTI);
  const baseLoss = (beta * (950 - currentTI)) / 2;
  const timelinessPenalty = (daysLate / 7) * 2;
  const amountFactor = 1 + loanAmount / 20000;

  const totalLoss = Math.floor(baseLoss + timelinessPenalty + amountFactor);
  // Ensure loss doesn't drop TI below 0
  return Math.min(totalLoss, currentTI);
}

/**
 * Calculates the TI impact on an endorser based on the receiver's actions.
 * @param {number} receiverTIGainOrLoss - The TI gain or loss experienced by the receiver.
 * @param {number} numberOfEndorsers - The total number of users endorsing the receiver.
 * @returns {number} The TI gain/loss for each endorser.
 */
export function getEndorserImpact(receiverTIGainOrLoss, numberOfEndorsers) {
  if (numberOfEndorsers <= 0) return 0;
  return Math.floor(receiverTIGainOrLoss / numberOfEndorsers);
}

/**
 * Calculates the TI impact on a guarantor based on the receiver's actions.
 * @param {number} receiverTIGainOrLoss - The TI gain or loss experienced by the receiver.
 * @returns {number} The TI gain/loss for the guarantor.
 */
export function getGuarantorImpact(receiverTIGainOrLoss) {
  return Math.floor(receiverTIGainOrLoss / 2);
}

/**
 * Determines the maximum loan amount a user is eligible for based on their TI.
 * @param {number} currentTI - The user's current TrustIndex.
 * @param {object} [premiumInfo] - Optional premium information.
 * @param {boolean} [premiumInfo.active] - Whether the user has an active premium.
 * @param {string} [premiumInfo.plan] - The premium plan type.
 * @returns {number} The maximum eligible loan amount.
 */
export function getMaxLoanLimit(currentTI, premiumInfo) {
  const tierIndex = LOAN_LIMITS.findIndex(
    (t) => currentTI >= t.range[0] && currentTI < t.range[1]
  );

  let limit = tierIndex >= 0 ? LOAN_LIMITS[tierIndex].limit : 0;

  if (premiumInfo?.active) {
    if (premiumInfo.plan === "RECEIVER" && tierIndex >= 0) {
      // Premium receiver: access one tier above
      const nextTier = tierIndex + 1;
      if (nextTier < LOAN_LIMITS.length) {
        limit = LOAN_LIMITS[nextTier].limit;
      }
    } else if (premiumInfo.plan === "LENDER") {
      // Premium lender: 2× limit, capped at ₹40,000
      limit = Math.min(limit * 2, 40000);
    }
  }

  return limit;
}
