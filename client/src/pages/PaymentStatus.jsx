import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import api from "../api/api";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("confirm"); // confirm | processing | success | error
  const [message, setMessage] = useState("");

  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentType = searchParams.get("type"); // 'EMI', 'DISBURSAL', or 'GUARANTOR_PAY'
  const emiNumber = searchParams.get("emiNumber"); // EMI installment number

  // Extract contractId from merchantOrderId (format: TYPE_contractId_suffix)
  const contractId = merchantOrderId?.split("_")[1];

  const triggerCallback = async () => {
    if (!merchantOrderId || !contractId) {
      setStatus("error");
      setMessage("Invalid payment information.");
      return;
    }

    setStatus("processing");
    setMessage("Verifying your payment…");

    try {
      await api.post("/payments/callback", {
        type: "CHECKOUT_ORDER_COMPLETED",
        payload: {
          merchantId: "PGTESTPAYUAT",
          originalMerchantOrderId: merchantOrderId,
          state: "COMPLETED",
          amount: 0,
          metaInfo: {
            contractId: contractId,
            paymentType: paymentType || "EMI",
            ...(emiNumber ? { emiNumber: emiNumber } : {}),
          },
          paymentDetails: [{ state: "COMPLETED" }],
        },
      });

      setStatus("success");
      setMessage(
        paymentType === "DISBURSAL"
          ? "Disbursal payment completed successfully!"
          : paymentType === "GUARANTOR_PAY"
          ? "Guarantor liability payment completed!"
          : `EMI${emiNumber ? ` #${emiNumber}` : ""} payment completed!`
      );

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Payment processing failed."
      );
    }
  };

  const handleCancel = () => {
    if (contractId) {
      navigate(`/contracts/${contractId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const getPaymentLabel = () => {
    if (paymentType === "DISBURSAL") return "Disbursal Payment";
    if (paymentType === "GUARANTOR_PAY") return "Guarantor Liability Payment";
    return emiNumber ? `EMI #${emiNumber} Payment` : "EMI Payment";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
      <div className="bg-slate-800/80 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">

        {/* ── Step 1: Confirm the payment ── */}
        {status === "confirm" && (
          <>
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Confirm Your Payment
            </h2>
            <p className="text-slate-400 mb-1 text-sm">
              {getPaymentLabel()}
            </p>
            <p className="text-slate-300 mb-6">
              Did your payment go through successfully?
            </p>

            <div className="space-y-3">
              <button
                onClick={triggerCallback}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20"
              >
                ✓ Yes, Payment Was Successful
              </button>
              <button
                onClick={handleCancel}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium transition-colors"
              >
                ✕ I Cancelled / Payment Failed
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Processing ── */}
        {status === "processing" && (
          <>
            <Loader />
            <h2 className="text-2xl font-bold text-white mt-4 mb-2">
              Processing Payment
            </h2>
            <p className="text-slate-300">{message}</p>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-slate-300 mb-4">{message}</p>
            <p className="text-sm text-slate-500 mb-4">
              Redirecting to dashboard…
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors"
            >
              Go to Dashboard Now
            </button>
          </>
        )}

        {/* ── Step 4: Error ── */}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Issue
            </h2>
            <p className="text-slate-300 mb-6">{message}</p>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors"
            >
              {contractId ? "Back to Contract" : "Back to Dashboard"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
