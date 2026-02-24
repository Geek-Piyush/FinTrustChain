import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { payments } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLLS = 20; // give up after ~60 seconds

export default function PaymentStatus() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const merchantOrderId = params.get("merchantOrderId");
  const type = params.get("type") || "EMI";
  const emiNumber = params.get("emiNumber");
  const plan = params.get("plan");      // for SUBSCRIPTION
  const duration = params.get("duration"); // for SUBSCRIPTION

  const [state, setState] = useState("POLLING"); // POLLING | COMPLETED | FAILED | TIMEOUT
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!merchantOrderId) {
      setState("FAILED");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        // Pass extra params so demo-mode fallback can activate subscription
        const queryParams = {};
        if (emiNumber) queryParams.emiNumber = emiNumber;
        if (duration) queryParams.duration = duration;

        const { data } = await payments.checkStatus(merchantOrderId, queryParams);
        const paymentState = data?.data?.paymentState;

        if (cancelled) return;

        if (paymentState === "COMPLETED") {
          // For subscriptions, refresh auth context so premium badge reflects immediately
          if (type === "SUBSCRIPTION" && refreshUser) {
            await refreshUser();
          }
          setState("COMPLETED");
          return;
        }

        if (paymentState === "FAILED") {
          setState("FAILED");
          return;
        }

        // Still pending — poll again if under limit
        setPollCount((prev) => {
          const next = prev + 1;
          if (next >= MAX_POLLS) {
            setState("TIMEOUT");
            return next;
          }
          if (!cancelled) {
            setTimeout(poll, POLL_INTERVAL);
          }
          return next;
        });
      } catch (err) {
        console.error("Payment status check failed:", err);
        if (!cancelled) {
          setPollCount((prev) => {
            const next = prev + 1;
            if (next >= MAX_POLLS) {
              setState("TIMEOUT");
              return next;
            }
            setTimeout(poll, POLL_INTERVAL);
            return next;
          });
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [merchantOrderId]);

  const typeLabel =
    type === "SUBSCRIPTION"
      ? `${plan ?? ""} Premium Subscription`.trim()
      : type === "DISBURSAL"
        ? "Disbursal"
        : type === "GUARANTOR_PAY"
          ? "Guarantor Settlement"
          : emiNumber
            ? `EMI #${emiNumber}`
            : "Payment";

  // Where to navigate after completion
  const successDestination = type === "SUBSCRIPTION" ? "/premium" : "/debts";
  const failDestination = type === "SUBSCRIPTION" ? "/premium" : "/debts";
  const successLabel = type === "SUBSCRIPTION" ? "View My Plan" : "View My Loans";
  const failLabel = type === "SUBSCRIPTION" ? "Back to Plans" : "Back to Loans";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        {state === "POLLING" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Verifying {typeLabel}
            </h2>
            <p className="text-gray-400 text-sm">
              Confirming with payment gateway... This may take a few seconds.
            </p>
            <div className="mt-4 w-full bg-white/5 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 95)}%` }}
              />
            </div>
          </>
        )}

        {state === "COMPLETED" && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {typeLabel} Successful!
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {type === "SUBSCRIPTION"
                ? "Your premium plan is now active. Enjoy your benefits!"
                : "Your payment has been verified and processed."}
            </p>
            <button
              onClick={() => navigate(successDestination)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
            >
              {successLabel}
            </button>
          </>
        )}

        {state === "FAILED" && (
          <>
            <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {typeLabel} Failed
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {!merchantOrderId
                ? "No order ID found. Please try again."
                : "The payment could not be verified. If money was debited, it will be refunded."}
            </p>
            <button
              onClick={() => navigate(failDestination)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
            >
              {failLabel}
            </button>
          </>
        )}

        {state === "TIMEOUT" && (
          <>
            <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Verification Taking Longer Than Expected
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              PhonePe hasn't confirmed yet. Your payment may still be processing.
              {type === "SUBSCRIPTION"
                ? " Check your plan status in a few minutes."
                : " Check your loan status in a few minutes."}
            </p>
            <button
              onClick={() => navigate(successDestination)}
              className="px-6 py-3 bg-amber-500/80 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors"
            >
              {type === "SUBSCRIPTION" ? "Go to Plans" : "View My Loans"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
