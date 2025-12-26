import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, Upload, User, Mail, Lock } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [eSignFile, setESignFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nav = useNavigate();
  const { register } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    if (!eSignFile) {
      toast.error("Please upload an e-signature image file.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("passwordConfirm", form.passwordConfirm);
      fd.append("eSign", eSignFile, eSignFile.name);

      const result = await register(fd);
      if (result.ok) nav("/verify");
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">
            Join the trust-based lending community
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a2332]/60 border border-blue-500/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
          <form onSubmit={submit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1214] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1214] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#1214] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.passwordConfirm}
                  onChange={(e) =>
                    setForm({ ...form, passwordConfirm: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#1214] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* E-Signature Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-Signature Image
              </label>
              <div className="relative">
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setESignFile(e.target.files[0])}
                  className="hidden"
                  id="esign-upload"
                />
                <label
                  htmlFor="esign-upload"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#1214] border border-white/10 border-dashed cursor-pointer hover:border-blue-500/50 transition-colors"
                >
                  <Upload size={20} className="text-slate-500" />
                  <span className={eSignFile ? "text-white" : "text-slate-500"}>
                    {eSignFile ? eSignFile.name : "Upload signature (PNG/JPEG)"}
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Required for contract signing
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-slate-400">Already have an account? </span>
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
