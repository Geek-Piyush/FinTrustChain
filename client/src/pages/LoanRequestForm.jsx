import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loanRequests, dashboard, users } from "../api/api";
import Loader from "../components/Loader";

export default function LoanRequestForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedBrochures, setSelectedBrochures] = useState([]);
  const [purpose, setPurpose] = useState("");
  const [incomeProof, setIncomeProof] = useState(null);
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const [guarantorResults, setGuarantorResults] = useState([]);
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [eligibleGuarantors, setEligibleGuarantors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // If brochure passed from navigation state
    if (location.state?.brochure) {
      setSelectedBrochures([location.state.brochure]);
    }
    loadEligibleGuarantors();
  }, []);

  const loadEligibleGuarantors = async () => {
    try {
      const res = await dashboard.eligibleGuarantors();
      setEligibleGuarantors(
        res.data?.data?.guarantors || res.data?.guarantors || []
      );
    } catch (err) {
      console.error("Failed to load guarantors", err);
    }
  };

  const handleSearchGuarantor = async () => {
    if (!guarantorSearch.trim()) return;
    setSearching(true);
    try {
      const res = await users.search(guarantorSearch);
      const results = res.data?.data?.users || res.data?.users || [];
      setGuarantorResults(results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectGuarantor = (guarantor) => {
    setSelectedGuarantor(guarantor);
    setGuarantorSearch("");
    setGuarantorResults([]);
  };

  const toggleBrochure = (brochure) => {
    setSelectedBrochures((prev) => {
      const exists = prev.find(
        (b) => (b._id || b.id) === (brochure._id || brochure.id)
      );
      if (exists) {
        return prev.filter(
          (b) => (b._id || b.id) !== (brochure._id || brochure.id)
        );
      }
      if (prev.length >= 3) {
        alert("You can select maximum 3 brochures");
        return prev;
      }
      return [...prev, brochure];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (selectedBrochures.length === 0) {
      alert("Please select at least one brochure");
      return;
    }

    if (!selectedGuarantor) {
      alert("Please select a guarantor");
      return;
    }

    if (!user?.upiId) {
      alert(
        "Please update your UPI ID in profile before creating loan request"
      );
      navigate("/update-profile");
      return;
    }

    if (!purpose.trim()) {
      alert("Please provide a purpose for the loan");
      return;
    }

    setLoading(true);
    try {
      const brochureIds = selectedBrochures.map((b) => b._id || b.id);

      const payload = {
        brochureIds: brochureIds,
        guarantorId: selectedGuarantor._id || selectedGuarantor.id,
        purpose: purpose,
      };

      const response = await loanRequests.create(payload);

      alert("Loan request created successfully! Guarantor has been notified.");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create loan request");
    } finally {
      setLoading(false);
    }
  };

  const getTIColor = (ti) => {
    if (ti >= 800) return "text-emerald-400";
    if (ti >= 600) return "text-green-400";
    if (ti >= 500) return "text-yellow-400";
    if (ti >= 400) return "text-orange-400";
    return "text-red-400";
  };

  const isGuarantorEligible = (guarantor) => {
    if (!guarantor) return false;
    if (guarantor._id === user?._id || guarantor.id === user?.id) return false;
    if (guarantor.trustIndex < 500) return false;
    return true;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">
          Create Loan Request
        </h1>
        <p className="text-gray-400 mb-8">
          Select up to 3 brochures and choose a guarantor
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Brochures Display */}
          <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Selected Brochures ({selectedBrochures.length}/3)
            </h2>

            {selectedBrochures.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No brochures selected. Go to dashboard to browse available
                brochures.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBrochures.map((brochure, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1214] border border-white/10 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        ₹{brochure.amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {brochure.tenorDays} days • {brochure.interestRate}%
                        interest
                      </div>
                      <div className="text-xs text-gray-500">
                        Lender: {brochure.lender?.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBrochure(brochure)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={4}
              maxLength={500}
              placeholder="Explain why you need this loan..."
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {purpose.length}/500
            </div>
          </div>

          {/* Income Proof */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Income Proof <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIncomeProof(e.target.files[0])}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-500 file:text-white
                hover:file:bg-blue-600"
            />
          </div>

          {/* Guarantor Selection */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Select Guarantor <span className="text-red-500">*</span>
            </h2>

            {selectedGuarantor ? (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold">
                      {selectedGuarantor.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {selectedGuarantor.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedGuarantor.email}
                      </div>
                      <div
                        className={`text-sm font-semibold ${getTIColor(
                          selectedGuarantor.trustIndex
                        )}`}
                      >
                        TI: {selectedGuarantor.trustIndex}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGuarantor(null)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guarantorSearch}
                      onChange={(e) => setGuarantorSearch(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleSearchGuarantor())
                      }
                      placeholder="Search by name or email..."
                      className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSearchGuarantor}
                      disabled={searching}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium disabled:opacity-50"
                    >
                      {searching ? "..." : "Search"}
                    </button>
                  </div>

                  {guarantorResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {guarantorResults.map((g) => {
                        const eligible = isGuarantorEligible(g);
                        return (
                          <div
                            key={g._id}
                            className={`p-3 rounded-lg border ${
                              eligible
                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                                  {g.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-white">
                                    {g.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {g.email}
                                  </div>
                                  <div
                                    className={`text-sm font-semibold ${getTIColor(
                                      g.trustIndex
                                    )}`}
                                  >
                                    TI: {g.trustIndex}
                                  </div>
                                </div>
                              </div>
                              {eligible ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectGuarantor(g)}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white text-sm"
                                >
                                  Select
                                </button>
                              ) : (
                                <span className="text-xs text-red-400">
                                  {g.trustIndex < 500
                                    ? "TI too low"
                                    : "Not eligible"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Eligible Guarantors */}
                {eligibleGuarantors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">
                      Suggested Guarantors
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {eligibleGuarantors.slice(0, 5).map((g) => (
                        <button
                          key={g._id}
                          type="button"
                          onClick={() => handleSelectGuarantor(g)}
                          className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                              {g.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {g.name}
                              </div>
                              <div
                                className={`text-sm font-semibold ${getTIColor(
                                  g.trustIndex
                                )}`}
                              >
                                TI: {g.trustIndex}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                loading || selectedBrochures.length === 0 || !selectedGuarantor
              }
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                `Submit ${selectedBrochures.length} Loan Request${
                  selectedBrochures.length > 1 ? "s" : ""
                }`
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-6 py-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
