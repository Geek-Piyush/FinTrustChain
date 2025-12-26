import React, { useState } from "react";
import { brochures } from "../api/api";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function CreateBrochure() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    interestRate: "",
    tenorDays: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    const amount = parseFloat(formData.amount);
    if (!amount || amount < 500 || amount > 20000) {
      newErrors.amount = "Amount must be between ₹500 and ₹20,000";
    }

    const rate = parseFloat(formData.interestRate);
    if (!rate || rate <= 0) {
      newErrors.interestRate = "Interest rate must be greater than 0%";
    }

    const tenor = parseInt(formData.tenorDays);
    if (!tenor || tenor <= 0) {
      newErrors.tenorDays = "Tenor must be at least 1 day";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await brochures.create({
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        tenorDays: parseInt(formData.tenorDays),
        description: formData.description,
      });

      alert("Brochure created successfully!");
      navigate("/lender-dashboard");
      // Reload to show the new brochure
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create brochure");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined,
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/lender-dashboard")}
          className="mb-6 text-blue-400 hover:text-blue-300 pointer flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">
          Create Loan Brochure
        </h1>
        <p className="text-gray-400 mb-8">
          Set your lending terms for potential borrowers
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6 space-y-6"
        >
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Loan Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">₹</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="5000"
                className={`w-full pl-8 p-3 rounded-lg bg-[#1214] border ${
                  errors.amount ? "border-red-500" : "border-white/10"
                } text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors`}
                required
              />
            </div>
            {errors.amount && (
              <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Range: ₹500 - ₹20,000 (Microcredit Platform)
            </p>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interest Rate <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                placeholder="12"
                step="0.1"
                className={`w-full p-3 rounded-lg bg-[#1214] border ${
                  errors.interestRate ? "border-red-500" : "border-white/10"
                } text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors`}
                required
              />
              <span className="absolute right-3 top-3 text-gray-400">%</span>
            </div>
            {errors.interestRate && (
              <p className="text-red-400 text-xs mt-1">{errors.interestRate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Set your desired interest rate
            </p>
          </div>

          {/* Tenor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tenor (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="tenorDays"
              value={formData.tenorDays}
              onChange={handleChange}
              placeholder="90"
              className={`w-full p-3 rounded-lg bg-[#1214] border ${
                errors.tenorDays ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors`}
              required
            />
            {errors.tenorDays && (
              <p className="text-red-400 text-xs mt-1">{errors.tenorDays}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Borrower must pay before tenor expires (no EMI)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              placeholder="Add any specific terms or conditions..."
              className="w-full p-3 rounded-lg bg-[#1214] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {formData.description.length}/500
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
            <div className="bg-[#1214] rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-2xl font-bold text-white">
                    ₹
                    {formData.amount
                      ? parseFloat(formData.amount).toLocaleString()
                      : "—"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formData.tenorDays || "—"} days
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-400">
                    {formData.interestRate || "—"}%
                  </div>
                  <div className="text-xs text-gray-400">interest</div>
                </div>
              </div>
              {formData.description && (
                <p className="text-sm text-gray-400 mt-3">
                  {formData.description}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                "Create Brochure"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/lender-dashboard")}
              className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
