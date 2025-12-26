import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

export default function Verify() {
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const nav = useNavigate();

  const checkVerified = async () => {
    setChecking(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No session token found. Please log in.");
        nav("/login");
        return;
      }
      await refreshUser();
      toast.success("Verification status checked. Redirecting...");
      nav("/dashboard");
    } catch {
      toast.error(
        "Still not verified. Check your email for the verification link."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Mail size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Verify Your Email
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            We've sent a verification link to your registered email address.
            Please check your inbox and click the link to activate your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a2332]/60 border border-blue-500/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
          <div className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#1214] border border-white/5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-semibold text-sm">
                    1
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">Check your inbox</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Look for an email from FinTrustChain
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#1214] border border-white/5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-semibold text-sm">
                    2
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Click the verification link
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    The link will activate your account
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#1214] border border-white/5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-semibold text-sm">
                    3
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Come back and continue
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Click the button below once verified
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={checkVerified}
                disabled={checking}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {checking ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    I've Verified
                  </>
                )}
              </button>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-slate-500">
              Didn't receive the email? Check your spam folder or contact
              support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
