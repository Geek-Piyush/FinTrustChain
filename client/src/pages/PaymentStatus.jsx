import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import api from "../api/api";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");

  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentType = searchParams.get("type"); // 'EMI' or 'DISBURSAL'

  // Extract contractId from merchantOrderId (format: TYPE_contractId_suffix)
  const contractId = merchantOrderId?.split("_")[1];

  console.log("PaymentStatus loaded:", {
    merchantOrderId,
    paymentType,
    contractId,
  });

  useEffect(() => {
    const triggerCallback = async () => {
      if (!merchantOrderId || !contractId) {
        setStatus("error");
        setMessage("Invalid payment information");
        console.error("Missing payment info:", { merchantOrderId, contractId });
        return;
      }

      try {
        console.log("Calling payment callback API for contract:", contractId);
        console.log("Full callback payload:", {
          type: "CHECKOUT_ORDER_COMPLETED",
          payload: {
            merchantId: "PGTESTPAYUAT",
            originalMerchantOrderId: merchantOrderId,
            state: "COMPLETED",
            amount: 450,
            metaInfo: {
              contractId: contractId,
              paymentType: paymentType || "EMI",
            },
            paymentDetails: [{ state: "COMPLETED" }],
          },
        });

        // Trigger the callback endpoint
        const response = await api.post("/payments/callback", {
          type: "CHECKOUT_ORDER_COMPLETED",
          payload: {
            merchantId: "PGTESTPAYUAT",
            originalMerchantOrderId: merchantOrderId,
            state: "COMPLETED",
            amount: 450,
            metaInfo: {
              contractId: contractId,
              paymentType: paymentType || "EMI",
            },
            paymentDetails: [{ state: "COMPLETED" }],
          },
        });

        console.log("Callback response:", response.data);
        console.log("Callback successful! Redirecting to dashboard...");

        setStatus("success");
        setMessage(
          paymentType === "DISBURSAL"
            ? "Disbursal payment completed successfully!"
            : "Payment completed successfully!"
        );

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          console.log("Navigating to dashboard...");
          navigate("/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Payment callback error:", error);
        console.error("Error response:", error.response);
        console.error("Error message:", error.message);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Payment processing failed. Check console for details."
        );
      }
    };

    triggerCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
      <div className="bg-slate-800/80 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Debug Info - Always Visible */}
        <div className="bg-black/30 rounded-lg p-3 mb-4 text-left text-xs">
          <div className="text-gray-400">Debug Info:</div>
          <div className="text-green-400">Status: {status}</div>
          <div className="text-blue-400">
            merchantOrderId: {merchantOrderId || "MISSING"}
          </div>
          <div className="text-blue-400">
            contractId: {contractId || "MISSING"}
          </div>
          <div className="text-blue-400">
            paymentType: {paymentType || "MISSING"}
          </div>
        </div>

        {status === "processing" && (
          <>
            <Loader />
            <h2 className="text-2xl font-bold text-white mt-4 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <p className="text-sm text-gray-400 mb-4">
              Redirecting to dashboard...
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-blue-500 hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors"
            >
              Go to Dashboard Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Processing Issue
            </h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-red-300 mb-2">
                <strong>Error Details:</strong>
              </p>
              <p className="text-xs text-gray-300">
                Please check the browser console (F12) for detailed error logs.
              </p>
            </div>
            <button
              onClick={() => {
                if (contractId) {
                  navigate(`/contracts/${contractId}`);
                } else {
                  navigate("/dashboard");
                }
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors"
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
