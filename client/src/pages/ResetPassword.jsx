import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { auth } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

const RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  {
    label: "One special character (@$!%*?&#^()_-+=)",
    test: (p) => /[@$!%*?&#^()_\-+=]/.test(p),
  },
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isValid = PASSWORD_REGEX.test(password) && password === passwordConfirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await auth.resetPassword(token, {
        password,
        passwordConfirm,
      });
      // Auto-login the user
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.data.user);
      }
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Reset token is invalid or has expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Set New Password
          </h1>
          <p className="text-slate-400">
            Choose a strong password for your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a2332]/60 border border-blue-500/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Password Reset Successfully!
              </h2>
              <p className="text-slate-400 text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#1214] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Strength Checklist */}
                {password.length > 0 && (
                  <div className="space-y-1.5 px-1">
                    {RULES.map(({ label, test }) => {
                      const pass = test(password);
                      return (
                        <div
                          key={label}
                          className={`flex items-center gap-2 text-xs transition-colors ${pass ? "text-emerald-400" : "text-slate-500"
                            }`}
                        >
                          {pass ? (
                            <CheckCircle size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          {label}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      required
                      type="password"
                      placeholder="Re-enter new password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1214] border text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-all ${passwordConfirm.length > 0 &&
                          password !== passwordConfirm
                          ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500"
                          : "border-white/10 focus:border-blue-500 focus:ring-indigo-500"
                        }`}
                    />
                  </div>
                  {passwordConfirm.length > 0 &&
                    password !== passwordConfirm && (
                      <p className="text-rose-400 text-xs mt-1.5">
                        Passwords do not match
                      </p>
                    )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
