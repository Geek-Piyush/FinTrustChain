import React, { useEffect, useState } from "react";
import { dashboard, payments as paymentsApi } from "../api/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { CreditCard, FileText, IndianRupee } from "lucide-react";

export default function Payments() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await dashboard.myActiveContracts();
        if (!mounted) return;
        const list = res?.data?.data?.contracts || res?.data || [];
        setContracts(Array.isArray(list) ? list : []);
      } catch (err) {
        setContracts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const handlePay = async (contractId) => {
    setPaying(contractId);
    try {
      const res = await paymentsApi.pay({ contractId });
      const redirectUrl =
        res?.data?.data?.redirectUrl || res?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error("Failed to get payment URL");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Payment failed"
      );
      setPaying(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payments</h1>
          <p className="text-gray-400">
            Manage and process payments for your active contracts
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-[#1a2332]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No Active Contracts
                </h3>
                <p className="text-gray-400">
                  You don't have any contracts requiring payment at this time.
                </p>
              </div>
            ) : (
              contracts.map((c) => {
                const schedule = c.repaymentSchedule || [];
                const nextEMI = schedule.find((e) => e.status === "PENDING");
                const paidCount = schedule.filter((e) => e.status === "PAID").length;
                const totalCount = schedule.length;

                return (
                <div
                  key={c._id || c.id}
                  className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Contract: {c.contractId || c._id}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400"
                              : c.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {c.totalAmount?.toLocaleString?.() ?? c.amount}
                        </span>
                      </div>
                      {totalCount > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-gray-400">
                            EMI Progress: {paidCount}/{totalCount} paid
                          </div>
                          <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${(paidCount / totalCount) * 100}%` }}
                            />
                          </div>
                          {nextEMI && (
                            <div className="text-xs text-yellow-400">
                              Next: EMI #{nextEMI.emiNumber} — ₹{nextEMI.amountDue?.toLocaleString()} due {new Date(nextEMI.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={() => handlePay(c._id || c.id)}
                    disabled={paying === (c._id || c.id) || !nextEMI}
                  >
                    {paying === (c._id || c.id) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : nextEMI ? (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay EMI #{nextEMI.emiNumber}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        All Paid ✓
                      </>
                    )}
                  </button>
                </div>
              );})
            )}
          </div>
        )}
      </div>
    </div>
  );
}
