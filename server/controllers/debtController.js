import Contract from "../models/contractModel.js";

/**
 * GET /debts/my
 * Returns the logged-in user's debts split into receiverDebts and guarantorDebts.
 */
export const getMyDebts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Receiver debts: contracts where user is receiver and loan is ACTIVE or DEFAULT
    const receiverDebts = await Contract.find({
      receiver: userId,
      status: { $in: ["ACTIVE", "DEFAULT"] },
    })
      .populate("lender", "name avatarUrl")
      .populate("guarantor", "name avatarUrl")
      .sort({ createdAt: -1 });

    // Guarantor debts: defaulted contracts where user is guarantor and liability is unpaid
    const guarantorDebts = await Contract.find({
      guarantor: userId,
      status: "DEFAULT",
      guarantorLiabilityPaid: { $ne: true },
    })
      .populate("lender", "name avatarUrl")
      .populate("receiver", "name avatarUrl")
      .sort({ createdAt: -1 });

    // Also fetch settled guarantor liabilities for display
    const settledGuarantorDebts = await Contract.find({
      guarantor: userId,
      status: "DEFAULT",
      guarantorLiabilityPaid: true,
    })
      .populate("lender", "name avatarUrl")
      .populate("receiver", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        receiverDebts: receiverDebts.map((c) => ({
          _id: c._id,
          lender: c.lender,
          guarantor: c.guarantor,
          principal: c.principal,
          interestRate: c.interestRate,
          tenorDays: c.tenorDays,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
          repaymentSchedule: c.repaymentSchedule,
          totalPayable:
            c.principal + (c.principal * c.interestRate) / 100,
        })),
        guarantorDebts: guarantorDebts.map((c) => ({
          _id: c._id,
          lender: c.lender,
          receiver: c.receiver,
          principal: c.principal,
          status: c.status,
          guarantorLiabilityAmount:
            c.guarantorLiabilityAmount || Math.round(c.principal * 0.5),
          guarantorLiabilityPaid: c.guarantorLiabilityPaid,
        })),
        settledGuarantorDebts: settledGuarantorDebts.map((c) => ({
          _id: c._id,
          lender: c.lender,
          receiver: c.receiver,
          principal: c.principal,
          status: c.status,
          guarantorLiabilityAmount:
            c.guarantorLiabilityAmount || Math.round(c.principal * 0.5),
          guarantorLiabilityPaid: c.guarantorLiabilityPaid,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /debts/summary
 * Returns aggregated outstanding amounts for the logged-in user.
 */
export const getDebtSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Receiver: sum of pending EMI amounts across active/defaulted contracts
    const receiverContracts = await Contract.find({
      receiver: userId,
      status: { $in: ["ACTIVE", "DEFAULT"] },
    });

    let totalReceiverOwed = 0;
    let totalEMIsPending = 0;
    for (const c of receiverContracts) {
      for (const emi of c.repaymentSchedule) {
        if (emi.status === "PENDING" || emi.status === "OVERDUE") {
          totalReceiverOwed += emi.amountDue;
          totalEMIsPending += 1;
        }
      }
    }

    // Guarantor: sum of unpaid liabilities
    const guarantorContracts = await Contract.find({
      guarantor: userId,
      status: "DEFAULT",
      guarantorLiabilityPaid: { $ne: true },
    });

    const totalGuarantorOwed = guarantorContracts.reduce(
      (sum, c) =>
        sum + (c.guarantorLiabilityAmount || Math.round(c.principal * 0.5)),
      0
    );

    res.status(200).json({
      status: "success",
      data: {
        totalReceiverOwed,
        totalEMIsPending,
        totalGuarantorOwed,
        guarantorDebtsCount: guarantorContracts.length,
        totalOwed: totalReceiverOwed + totalGuarantorOwed,
      },
    });
  } catch (error) {
    next(error);
  }
};
