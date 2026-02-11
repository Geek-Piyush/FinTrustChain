/**
 * EMI Schedule Generation Service
 *
 * Generates a flat EMI repayment schedule for a contract.
 * EMI count is determined by the loan tenor:
 *   - tenorDays <= 30  → 1 EMI (lump sum)
 *   - tenorDays <= 90  → 3 EMIs (monthly)
 *   - tenorDays <= 180 → 6 EMIs
 *   - tenorDays > 180  → Math.ceil(tenorDays / 30) EMIs
 */

/**
 * @param {Object} contract - Mongoose contract document (must have startDate, endDate, principal, interestRate, tenorDays)
 * @returns {Array} repaymentSchedule array ready to assign to contract.repaymentSchedule
 */
export function generateEMISchedule(contract) {
  const { principal, interestRate, tenorDays, startDate } = contract;

  // Calculate total payable
  const totalInterest = principal * (interestRate / 100);
  const totalPayable = principal + totalInterest;

  // Determine number of EMIs based on tenor
  let numEMIs;
  if (tenorDays <= 30) {
    numEMIs = 1;
  } else if (tenorDays <= 90) {
    numEMIs = 3;
  } else if (tenorDays <= 180) {
    numEMIs = 6;
  } else {
    numEMIs = Math.ceil(tenorDays / 30);
  }

  // Calculate per-EMI amounts (flat split)
  const emiPrincipal = Math.floor((principal / numEMIs) * 100) / 100;
  const emiInterest = Math.floor((totalInterest / numEMIs) * 100) / 100;

  // Calculate interval between EMIs in days
  const intervalDays = Math.floor(tenorDays / numEMIs);

  const schedule = [];
  const start = new Date(startDate);

  for (let i = 0; i < numEMIs; i++) {
    const isLast = i === numEMIs - 1;

    // Last EMI absorbs any rounding remainder
    const emPrincipal = isLast
      ? Math.round((principal - emiPrincipal * (numEMIs - 1)) * 100) / 100
      : emiPrincipal;
    const emInterest = isLast
      ? Math.round((totalInterest - emiInterest * (numEMIs - 1)) * 100) / 100
      : emiInterest;

    // Due date: each EMI is spaced evenly; last EMI is on the exact end date
    const dueDate = new Date(start);
    if (isLast) {
      dueDate.setDate(start.getDate() + tenorDays);
    } else {
      dueDate.setDate(start.getDate() + intervalDays * (i + 1));
    }

    schedule.push({
      emiNumber: i + 1,
      dueDate,
      amountDue: Math.round((emPrincipal + emInterest) * 100) / 100,
      principal: emPrincipal,
      interest: emInterest,
      status: "PENDING",
    });
  }

  return schedule;
}
