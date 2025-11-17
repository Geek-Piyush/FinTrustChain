import React, { useEffect, useState } from "react";
import {
  dashboard,
  guarantorRequests,
  loanRequests,
  brochures,
  contracts as contractsApi,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import TrustIndexHistory from "../components/TrustIndexHistory";
import GuarantorRequestCard from "../components/GuarantorRequestCard";
import { Check } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [pendingGRequests, setPendingGRequests] = useState([]);
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [availableBrochures, setAvailableBrochures] = useState([]);
  const [selectedBrochures, setSelectedBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Guarantor selection states - using endorsers
  const [myEndorsers, setMyEndorsers] = useState([]);
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, contractsRes, grRes, lrRes, brochuresRes, endorsersRes] =
        await Promise.all([
          dashboard.myStats().catch(() => ({ data: {} })),
          dashboard
            .myActiveContracts()
            .catch(() => ({ data: { data: { contracts: [] } } })),
          guarantorRequests
            .pending()
            .catch(() => ({ data: { data: { requests: [] } } })),
          loanRequests
            .getMy()
            .catch(() => ({ data: { data: { loanRequests: [] } } })),
          brochures.list().catch(() => ({ data: { data: { brochures: [] } } })),
          dashboard
            .myEndorsers()
            .catch(() => ({ data: { data: { endorsers: [] } } })),
        ]);

      setStats(statsRes.data?.data?.stats || null);
      setContracts(contractsRes.data?.data?.contracts || []);
      setPendingGRequests(grRes.data?.data?.requests || []);
      setMyLoanRequests(lrRes.data?.data?.loanRequests || []);
      setMyEndorsers(
        endorsersRes.data?.data?.endorsers || endorsersRes.data?.endorsers || []
      );

      // Filter brochures - only active ones, exclude user's own
      const allBrochures =
        brochuresRes.data?.data?.brochures ||
        brochuresRes.data?.brochures ||
        [];

      const filtered = allBrochures.filter(b => {
        const isActive = b.active === true || b.active === undefined;
        const lenderId = b.lender?._id || b.lender?.id || b.lender;
        const userId = user?._id || user?.id;
        const isNotOwnBrochure = lenderId !== userId;
        return isActive && isNotOwnBrochure;
      });

      setAvailableBrochures(filtered);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrochureSelection = brochure => {
    console.log("Toggling brochure:", brochure);
    setSelectedBrochures(prev => {
      console.log("Current selected brochures:", prev);
      const exists = prev.find(
        b => (b._id || b.id) === (brochure._id || brochure.id)
      );
      if (exists) {
        console.log("Removing brochure from selection");
        return prev.filter(
          b => (b._id || b.id) !== (brochure._id || brochure.id)
        );
      }
      if (prev.length >= 3) {
        alert("You can select maximum 3 brochures");
        return prev;
      }
      console.log("Adding brochure to selection");
      return [...prev, brochure];
    });
  };

  const handleGuarantorResponse = async (requestId, accepted) => {
    try {
      await guarantorRequests.respond(requestId, { accepted });
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond to request");
    }
  };

  const handleApplyForLoan = async () => {
    console.log("=== Apply for Loan ===");
    console.log("Selected brochures:", selectedBrochures);
    console.log("Selected guarantor:", selectedGuarantor);
    console.log("Purpose:", purpose);
    console.log("User UPI:", user?.upiId);

    // Check if user already has an active loan request
    const hasActiveLoanRequest = myLoanRequests.some(
      lr =>
        lr.status === "PENDING" ||
        lr.status === "PENDING_GUARANTOR" ||
        lr.status === "GUARANTOR_ACCEPTED" ||
        lr.status === "PENDING_LENDER"
    );

    if (hasActiveLoanRequest) {
      alert(
        "You already have an active loan request. Please wait for it to be processed or cancel it first."
      );
      return;
    }

    if (selectedBrochures.length === 0) {
      console.error("No brochures selected!");
      alert("Please select at least one brochure");
      return;
    }

    if (!selectedGuarantor) {
      alert("Please select a guarantor");
      return;
    }

    if (!purpose.trim()) {
      alert("Please provide a purpose for the loan");
      return;
    }

    if (!user?.upiId) {
      alert("Please update your UPI ID in profile before applying for a loan");
      navigate("/update-profile");
      return;
    }

    setApplying(true);
    try {
      // Create single loan request with all selected brochures
      const brochureIds = selectedBrochures.map(b => b._id || b.id);
      const guarantorId = selectedGuarantor._id || selectedGuarantor.id;

      const payload = {
        brochureIds,
        guarantorId,
        purpose,
      };

      console.log("Creating loan request with payload:", payload);
      await loanRequests.create(payload);

      alert(
        `Loan request created successfully for ${selectedBrochures.length} brochure(s)!`
      );

      // Reset form
      setSelectedBrochures([]);
      setSelectedGuarantor(null);
      setPurpose("");

      // Reload dashboard
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create loan request");
    } finally {
      setApplying(false);
    }
  };

  const getTIColor = ti => {
    if (ti >= 800) return "text-emerald-400";
    if (ti >= 600) return "text-green-400";
    if (ti >= 500) return "text-yellow-400";
    if (ti >= 400) return "text-orange-400";
    return "text-red-400";
  };

  const getStatusBadge = status => {
    const colors = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      PENDING_GUARANTOR: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      PENDING_LENDER: "bg-blue-500/20 text-blue-400 border-blue-500",
      GUARANTOR_ACCEPTED: "bg-purple-500/20 text-purple-400 border-purple-500",
      ACCEPTED: "bg-green-500/20 text-green-400 border-green-500",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500",
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500",
      CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500"
        }`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const isGuarantorEligible = guarantor => {
    if (!guarantor) return false;
    // Endorsers can be guarantors (they're different users by definition)
    // Just check TI requirement
    if (guarantor.trustIndex < 500) return false;
    return true;
  };

  if (loading)
    return (
      <div className="container-max py-24 flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );

  return (
    <div className="container-max py-24 min-h-screen">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Trust Index</div>
          <div
            className={`text-4xl font-bold ${getTIColor(
              stats?.trustIndex || user?.trustIndex
            )}`}
          >
            {stats?.trustIndex ?? user?.trustIndex ?? 400}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Eligible Loan</div>
          <div className="text-3xl font-bold text-white">
            ₹{stats?.eligibleLoan?.toLocaleString() ?? "—"}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Active Loans</div>
          <div className="text-3xl font-bold text-white">
            {contracts.length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Pending Requests</div>
          <div className="text-3xl font-bold text-white">
            {pendingGRequests.length}
          </div>
        </div>
      </div>

      {/* Available Brochures with Multi-Select */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            Available Loan Brochures
            {selectedBrochures.length > 0 && (
              <span className="ml-3 text-sm text-blue-400">
                ({selectedBrochures.length} selected)
              </span>
            )}
          </h2>
          <button
            onClick={loadDashboard}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors text-gray-300"
          >
            Refresh
          </button>
        </div>

        {availableBrochures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No brochures available at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBrochures.map(brochure => {
              const isSelected = selectedBrochures.some(
                b => (b._id || b.id) === (brochure._id || brochure.id)
              );

              return (
                <div
                  key={brochure._id || brochure.id}
                  onClick={() => toggleBrochureSelection(brochure)}
                  className={`relative bg-white/5 border rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ₹{brochure.amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {brochure.tenorDays} days
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-400">
                        {brochure.interestRate}%
                      </div>
                      <div className="text-xs text-gray-400">interest</div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                        {brochure.lender?.name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {brochure.lender?.name || "Lender"}
                        </div>
                        <div
                          className={`text-xs font-semibold ${getTIColor(
                            brochure.lender?.trustIndex
                          )}`}
                        >
                          TI: {brochure.lender?.trustIndex || "N/A"}
                        </div>
                      </div>
                    </div>

                    {brochure.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {brochure.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Posted {new Date(brochure.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Apply for Loan Section */}
        {selectedBrochures.length > 0 && (
          <div className="mt-8 border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Apply for Selected Loans
            </h3>

            {/* Selected Brochures Summary */}
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-gray-300 mb-2">
                Selected Brochures:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBrochures.map((b, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-500/20 border border-blue-500 rounded-full text-sm text-white"
                  >
                    ₹{b.amount?.toLocaleString()} • {b.tenorDays}d •{" "}
                    {b.interestRate}%
                  </span>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Explain why you need this loan..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {purpose.length}/500
              </div>
            </div>

            {/* Guarantor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Guarantor <span className="text-red-500">*</span>
              </label>

              {selectedGuarantor ? (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
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
                <div>
                  <p className="text-sm text-gray-400 mb-3">
                    Select one of your endorsers as guarantor (TI ≥ 500
                    required)
                  </p>
                  {myEndorsers.length === 0 ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                      <p className="text-yellow-400 text-sm">
                        You don't have any endorsers yet. Get endorsed by other
                        users to use them as guarantors.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myEndorsers.map(g => {
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
                                  onClick={() => {
                                    setSelectedGuarantor(g);
                                  }}
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
              )}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyForLoan}
              disabled={
                applying ||
                !selectedGuarantor ||
                !purpose.trim() ||
                selectedBrochures.length === 0
              }
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying
                ? "Submitting..."
                : `Apply for ${selectedBrochures.length} Loan${
                    selectedBrochures.length > 1 ? "s" : ""
                  }`}
            </button>

            {/* Validation helper text */}
            {(!selectedGuarantor || !purpose.trim()) && (
              <p className="text-xs text-yellow-400 mt-2 text-center">
                {!purpose.trim() && "Please enter purpose. "}
                {!selectedGuarantor && "Please select a guarantor."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* My Loan Requests */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">My Loan Requests</h2>
        </div>
        {myLoanRequests.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No loan requests yet
          </div>
        ) : (
          <div className="space-y-3">
            {myLoanRequests.map(req => (
              <div
                key={req._id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white">
                      ₹{req.amount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {req.tenorDays} days •{" "}
                      {req.guarantor?.name || "No guarantor"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Requested {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(req.status)}
                    {req.status === "ACCEPTED" && (
                      <button
                        onClick={() => navigate(`/contracts/${req.contractId}`)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white text-xs font-medium"
                      >
                        View Contract
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Active Contracts */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          My Active Contracts
        </h2>
        {contracts.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No active contracts
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map(c => {
              const isLender =
                user?._id === c.lender?._id || user?.id === c.lender?._id;
              const isReceiver =
                user?._id === c.receiver?._id || user?.id === c.receiver?._id;
              const isGuarantor =
                user?._id === c.guarantor?._id || user?.id === c.guarantor?._id;

              let myRole = "";
              if (isLender) myRole = "Lender";
              else if (isReceiver) myRole = "Receiver";
              else if (isGuarantor) myRole = "Guarantor";

              const needsMySignature =
                (isLender && !c.signatures?.lender) ||
                (isReceiver && !c.signatures?.receiver) ||
                (isGuarantor && !c.signatures?.guarantor);

              return (
                <div
                  key={c._id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        Contract #{c.contractId || c._id?.slice(-6)}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Lender: {c.lender?.name} • ₹
                        {c.principal?.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-400 mt-1">
                        Role: {myRole}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Next EMI:{" "}
                        {c.nextEMIDate
                          ? new Date(c.nextEMIDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {needsMySignature && c.status === "PENDING_SIGNATURES" && (
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          if (confirm("Sign this contract?")) {
                            try {
                              await contractsApi.sign(c._id);
                              alert("Contract signed successfully!");
                              loadDashboard();
                            } catch (err) {
                              alert(
                                err.response?.data?.message || "Failed to sign"
                              );
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 rounded text-white text-sm font-medium"
                      >
                        Sign Contract
                      </button>
                    )}
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          const res = await contractsApi.downloadPdf(c._id);
                          const url = window.URL.createObjectURL(
                            new Blob([res.data])
                          );
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute(
                            "download",
                            `contract_${c.contractId || c._id}.pdf`
                          );
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch {
                          alert("Failed to download PDF");
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => navigate(`/contracts/${c._id}`)}
                      className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guarantor Requests */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Guarantor Requests
        </h2>
        {pendingGRequests.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No pending requests
          </div>
        ) : (
          <div className="space-y-3">
            {pendingGRequests.map(req => (
              <GuarantorRequestCard
                key={req._id}
                request={req}
                onResponse={handleGuarantorResponse}
              />
            ))}
          </div>
        )}
      </div>

      {/* TrustIndex History */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          TrustIndex History
        </h2>
        <TrustIndexHistory />
      </div>
    </div>
  );
}
