import express from "express";
import {
  signContract,
  confirmDisbursal,
  confirmReceipt,
  uploadProof,
  initiateGuarantorPayment,
  initiateDisbursalPayment,
  getDisbursalProof,
  getReceiverUpi,
  getContractDetails,
  getContractPDF,
  getEMISchedule,
  getPaymentHistory,
} from "../controllers/contractController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { checkLoanDefaults } from "../utils/scheduler.js";
const router = express.Router();

// All contract routes require a user to be logged in.
router.use(protect);

router.get("/:id", getContractDetails);
router.get("/:id/emi-schedule", getEMISchedule);
router.get("/:id/payment-history", getPaymentHistory);

// Endpoint to fetch and download the contract PDF
router.get("/:id/download-pdf", getContractPDF);

// The main endpoint for any of the three parties to sign the contract.
// The ':id' refers to the ID of the Contract document.
router.post("/:id/sign", signContract);

// Endpoint for the Lender to initiate disbursal payment via PhonePe
router.post("/:id/initiate-disbursal", initiateDisbursalPayment);

// Endpoint for the Lender to confirm they've sent the money (manual proof upload - legacy)
router.post("/:id/confirm-disbursal", uploadProof, confirmDisbursal);

// Endpoint for the Receiver to confirm they've received the money
router.post("/:id/confirm-receipt", confirmReceipt);

// 2. Add the new endpoint for the Guarantor to pay their share of a defaulted loan
router.post("/:id/guarantor-pay", initiateGuarantorPayment);

// Admin Access testing
router.post("/admin/trigger-default-check", async (req, res) => {
  console.log("--- ADMIN: Manually triggering default check ---");
  await checkLoanDefaults();
  res.status(200).send("Default check triggered successfully.");
});

// Add the new route for the receiver to view the proof
router.get("/:id/disbursal-proof", getDisbursalProof);

// new route for the lender to get the receiver's UPI
router.get("/:id/receiver-upi", getReceiverUpi);

export default router;
