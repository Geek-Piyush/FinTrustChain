import React, { useEffect, useState } from "react";
import {
  lender,
  brochures,
  dashboard,
  contracts as contractsApi,
} from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { getAvatarUrl } from "../utils/imageUtils";

export default function LenderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myBrochures, setMyBrochures] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myContracts, setMyContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [_statsRes, brochuresRes, requestsRes, contractsRes] =
        await Promise.all([
          lender.getStats().catch(() => ({ data: {} })),
          lender
            .getMyBrochures()
            .catch(() => ({ data: { data: { brochures: [] } } })),
          lender
            .getPendingRequests()
            .catch(() => ({ data: { data: { requests: [] } } })),
          dashboard
            .myActiveContracts()
            .catch(() => ({ data: { data: { contracts: [] } } })),
        ]);

      setMyBrochures(
        brochuresRes.data?.data?.brochures || brochuresRes.data?.brochures || []
      );
      setPendingRequests(
        requestsRes.data?.data?.requests || requestsRes.data?.requests || []
      );
      setMyContracts(
        contractsRes.data?.data?.contracts || contractsRes.data?.contracts || []
      );
    } catch (err) {
      console.error("Failed to load lender dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBrochure = async (id) => {
    try {
      await brochures.toggleStatus(id);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle brochure status");
    }
  };

  const handleDeleteBrochure = async (id) => {
    if (!confirm("Are you sure you want to delete this brochure?")) return;
    try {
      await brochures.delete(id);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete brochure");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!confirm("Accept this loan request?")) return;
    try {
      await lender.acceptRequest(requestId);
      alert("Request accepted! Contract will be generated.");
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!confirm("Are you sure you want to reject this loan request?")) return;
    try {
      await lender.rejectRequest(requestId);
      alert("Loan request has been rejected.");
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  const getTIColor = (ti) => {
    if (ti >= 800) return "text-emerald-400";
    if (ti >= 600) return "text-green-400";
    if (ti >= 500) return "text-yellow-400";
    if (ti >= 400) return "text-orange-400";
    return "text-red-400";
  };

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500",
      INACTIVE: "bg-gray-500/20 text-gray-400 border-gray-500",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          colors[status] || colors.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Lender Dashboard</h1>
          <button
            onClick={() => navigate("/create-brochure")}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all"
          >
            + Create Brochure
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Total Brochures</div>
            <div className="text-3xl font-bold text-white">
              {myBrochures.length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Active Brochures</div>
            <div className="text-3xl font-bold text-green-400">
              {myBrochures.filter((b) => b.active === true).length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Pending Requests</div>
            <div className="text-3xl font-bold text-yellow-400">
              {pendingRequests.length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Active Contracts</div>
            <div className="text-3xl font-bold text-blue-400">
              {myContracts.filter((c) => c.status === "ACTIVE").length}
            </div>
          </div>
        </div>

        {/* My Brochures */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">My Brochures</h2>
            <button
              onClick={loadDashboard}
              className="text-sm text-gray-400 hover:text-white"
            >
              Refresh
            </button>
          </div>

          {myBrochures.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
              <p className="text-gray-400 mb-4">
                You haven't created any brochures yet
              </p>
              <button
                onClick={() => navigate("/create-brochure")}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
              >
                Create Your First Brochure
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBrochures.map((brochure) => (
                <div
                  key={brochure._id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ₹{brochure.amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {brochure.tenorDays} days
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-400">
                        {brochure.interestRate}%
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          brochure.active
                            ? "bg-green-500/20 text-green-400 border-green-500"
                            : "bg-gray-500/20 text-gray-400 border-gray-500"
                        }`}
                      >
                        {brochure.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>

                  {brochure.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {brochure.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleToggleBrochure(brochure._id, brochure.active)
                      }
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        brochure.active
                          ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {brochure.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteBrochure(brochure._id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Created {new Date(brochure.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Loan Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Pending Loan Requests
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-400">No pending requests at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                // Find the lender's brochure from the brochureIds array
                const myBrochure = request.brochureIds?.find(
                  (b) => b.lender === user?.id
                );
                const brochure = myBrochure || request.brochureIds?.[0]; // Fallback to first brochure

                return (
                  <div
                    key={request._id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Receiver Profile Section */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                          <img
                            src={
                              getAvatarUrl(request.receiver?.avatarUrl) ||
                              "https://via.placeholder.com/64"
                            }
                            alt={request.receiver?.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-white">
                              {request.receiver?.name || "Receiver"}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div
                                className={`text-sm font-semibold ${getTIColor(
                                  request.receiver?.trustIndex
                                )}`}
                              >
                                TI: {request.receiver?.trustIndex || "N/A"}
                              </div>
                              <div className="h-4 w-px bg-white/20"></div>
                              <div className="text-sm text-gray-400">
                                {request.receiver?.successfulRepayments || 0}{" "}
                                loans repaid
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-400">Amount</div>
                            <div className="text-lg font-bold text-white">
                              ₹{brochure?.amount?.toLocaleString() || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Tenor</div>
                            <div className="text-lg font-semibold text-white">
                              {brochure?.tenorDays || "N/A"} days
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">
                              Interest
                            </div>
                            <div className="text-lg font-semibold text-green-400">
                              {brochure?.interestRate || "N/A"}%
                            </div>
                          </div>
                        </div>

                        {request.purpose && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-400">Purpose</div>
                            <div className="text-sm text-gray-300">
                              {request.purpose}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Requested{" "}
                          {new Date(request.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded text-white font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded text-white font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Contracts */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">My Contracts</h2>
            <button
              onClick={() => navigate("/lender/contracts")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All →
            </button>
          </div>

          {myContracts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-400">No contracts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myContracts.slice(0, 4).map((contract) => {
                const isLender =
                  user?._id === contract.lender?._id ||
                  user?.id === contract.lender?._id;
                const isReceiver =
                  user?._id === contract.receiver?._id ||
                  user?.id === contract.receiver?._id;
                const isGuarantor =
                  user?._id === contract.guarantor?._id ||
                  user?.id === contract.guarantor?._id;

                let myRole = "";
                if (isLender) myRole = "Lender";
                else if (isReceiver) myRole = "Receiver";
                else if (isGuarantor) myRole = "Guarantor";

                const needsMySignature =
                  (isLender && !contract.signatures?.lender) ||
                  (isReceiver && !contract.signatures?.receiver) ||
                  (isGuarantor && !contract.signatures?.guarantor);

                return (
                  <div
                    key={contract._id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-white">
                          Contract #
                          {contract.contractId || contract._id?.slice(-6)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {contract.receiver?.name || "Receiver"}
                        </div>
                        <div className="text-xs text-blue-400 mt-1">
                          Role: {myRole}
                        </div>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400">Amount</div>
                        <div className="font-semibold text-white">
                          ₹{contract.principal?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Tenor</div>
                        <div className="font-semibold text-white">
                          {contract.tenorDays} days
                        </div>
                      </div>
                    </div>

                    {contract.nextEMIDate && (
                      <div className="text-xs text-gray-500 mb-3">
                        Next EMI:{" "}
                        {new Date(contract.nextEMIDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      {needsMySignature &&
                        contract.status === "PENDING_SIGNATURES" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Sign this contract?")) {
                                try {
                                  await contractsApi.sign(contract._id);
                                  alert("Contract signed successfully!");
                                  loadDashboard();
                                } catch (err) {
                                  alert(
                                    err.response?.data?.message ||
                                      "Failed to sign"
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await contractsApi.downloadPdf(
                              contract._id
                            );
                            const url = window.URL.createObjectURL(
                              new Blob([res.data])
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute(
                              "download",
                              `contract_${
                                contract.contractId || contract._id
                              }.pdf`
                            );
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                          } catch {
                            alert("Failed to download PDF");
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => navigate(`/contracts/${contract._id}`)}
                        className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
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
      </div>
    </div>
  );
}
