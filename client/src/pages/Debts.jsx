import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Calendar,
  ArrowRight,
  Shield,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { debts as debtsApi, contracts } from "../api/api";

export default function Debts() {
  const [loading, setLoading] = useState(true);
  const [receiverDebts, setReceiverDebts] = useState([]);
  const [guarantorDebts, setGuarantorDebts] = useState([]);
  const [settledGuarantorDebts, setSettledGuarantorDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payingContractId, setPayingContractId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [debtsRes, summaryRes] = await Promise.all([
        debtsApi.getMyDebts(),
        debtsApi.getSummary(),
      ]);
      setReceiverDebts(debtsRes.data?.data?.receiverDebts || []);
      setGuarantorDebts(debtsRes.data?.data?.guarantorDebts || []);
      setSettledGuarantorDebts(
        debtsRes.data?.data?.settledGuarantorDebts || []
      );
      setSummary(summaryRes.data?.data || null);
    } catch (err) {
      console.error("Failed to load debts:", err);
      setError("Failed to load your debts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuarantorPay = async (contractId) => {
    try {
      setPayingContractId(contractId);
      const res = await contracts.guarantorPay(contractId);
      const redirectUrl = res.data?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to initiate guarantor payment."
      );
    } finally {
      setPayingContractId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE:
        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
      DEFAULT: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
      PAID: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
      PENDING:
        "bg-amber-500/15 text-amber-400 border border-amber-500/20",
      OVERDUE: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
          styles[status] || "bg-slate-500/15 text-slate-400"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your debts…</p>
        </div>
      </div>
    );
  }

  const hasNoDebts =
    receiverDebts.length === 0 &&
    guarantorDebts.length === 0 &&
    settledGuarantorDebts.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-indigo-400" size={28} />
            My Debts
          </h1>
          <p className="text-slate-400 mt-2">
            Track your outstanding loan obligations and guarantor liabilities.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && !hasNoDebts && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <CreditCard size={20} className="text-amber-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  EMIs Pending
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalReceiverOwed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary.totalEMIsPending} installment
                {summary.totalEMIsPending !== 1 ? "s" : ""} remaining
              </p>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl">
                  <Shield size={20} className="text-rose-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  Guarantor Liability
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalGuarantorOwed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary.guarantorDebtsCount} defaulted loan
                {summary.guarantorDebtsCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <DollarSign size={20} className="text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  Total Outstanding
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalOwed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Combined obligations
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {hasNoDebts && (
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-12 text-center">
            <CheckCircle2
              size={48}
              className="text-emerald-400 mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-white mb-2">
              All Clear!
            </h2>
            <p className="text-slate-400">
              You have no outstanding debts or guarantor liabilities.
            </p>
          </div>
        )}

        {/* ── Receiver Debts: EMI Table ── */}
        {receiverDebts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-amber-400" />
              As Borrower — EMI Obligations
            </h2>

            <div className="space-y-5">
              {receiverDebts.map((debt) => {
                const pendingEMIs = debt.repaymentSchedule.filter(
                  (e) => e.status === "PENDING" || e.status === "OVERDUE"
                );
                const paidEMIs = debt.repaymentSchedule.filter(
                  (e) => e.status === "PAID"
                );

                return (
                  <div
                    key={debt._id}
                    className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    {/* Contract Header */}
                    <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {debt.lender?.name?.[0] || "L"}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Loan from {debt.lender?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(debt.principal)} at{" "}
                            {debt.interestRate}% for {debt.tenorDays} days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(debt.status)}
                        <Link
                          to={`/contracts/${debt._id}`}
                          className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors"
                        >
                          View <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>

                    {/* EMI Progress */}
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>
                          {paidEMIs.length} of{" "}
                          {debt.repaymentSchedule.length} EMIs paid
                        </span>
                        <span>
                          {Math.round(
                            (paidEMIs.length /
                              debt.repaymentSchedule.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (paidEMIs.length /
                                debt.repaymentSchedule.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* EMI Schedule Table */}
                    <div className="px-5 pb-5 pt-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wider">
                              <th className="text-left py-2 pr-4">
                                EMI #
                              </th>
                              <th className="text-left py-2 pr-4">
                                Due Date
                              </th>
                              <th className="text-right py-2 pr-4">
                                Amount
                              </th>
                              <th className="text-center py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {debt.repaymentSchedule.map((emi) => (
                              <tr
                                key={emi.emiNumber}
                                className="border-t border-white/5"
                              >
                                <td className="py-3 pr-4 text-slate-300 font-medium">
                                  #{emi.emiNumber}
                                </td>
                                <td className="py-3 pr-4 text-slate-400 flex items-center gap-1.5">
                                  <Calendar
                                    size={13}
                                    className="text-slate-600"
                                  />
                                  {formatDate(emi.dueDate)}
                                </td>
                                <td className="py-3 pr-4 text-right text-white font-medium">
                                  {formatCurrency(emi.amountDue)}
                                </td>
                                <td className="py-3 text-center">
                                  {getStatusBadge(emi.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pay Next EMI */}
                      {pendingEMIs.length > 0 &&
                        debt.status === "ACTIVE" && (
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                              Next:{" "}
                              <span className="text-white font-medium">
                                EMI #{pendingEMIs[0].emiNumber}
                              </span>{" "}
                              — {formatCurrency(pendingEMIs[0].amountDue)}{" "}
                              due {formatDate(pendingEMIs[0].dueDate)}
                            </p>
                            <Link
                              to={`/contracts/${debt._id}`}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                            >
                              Pay EMI
                            </Link>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Guarantor Debts: Lump Sum Liability ── */}
        {guarantorDebts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-rose-400" />
              As Guarantor — Outstanding Liabilities
            </h2>

            <div className="space-y-4">
              {guarantorDebts.map((debt) => (
                <div
                  key={debt._id}
                  className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <TrendingDown
                          size={22}
                          className="text-rose-400"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Guaranteed loan for{" "}
                          {debt.receiver?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Original loan:{" "}
                          {formatCurrency(debt.principal)} • Lender:{" "}
                          {debt.lender?.name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge("DEFAULT")}
                          <span className="text-xs text-slate-500">
                            Loan has defaulted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">
                        Your liability (50%)
                      </p>
                      <p className="text-2xl font-bold text-rose-400">
                        {formatCurrency(debt.guarantorLiabilityAmount)}
                      </p>
                      <button
                        onClick={() => handleGuarantorPay(debt._id)}
                        disabled={payingContractId === debt._id}
                        className="mt-3 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 ml-auto"
                      >
                        {payingContractId === debt._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <DollarSign size={16} />
                            Pay Liability
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Settled Guarantor Debts ── */}
        {settledGuarantorDebts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-400" />
              Settled Guarantor Liabilities
            </h2>

            <div className="space-y-3">
              {settledGuarantorDebts.map((debt) => (
                <div
                  key={debt._id}
                  className="bg-slate-900/60 border border-emerald-500/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2
                        size={20}
                        className="text-emerald-400"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Guaranteed loan for{" "}
                        {debt.receiver?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Original loan: {formatCurrency(debt.principal)} •
                        Lender: {debt.lender?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold">
                      SETTLED
                    </span>
                    <p className="text-sm text-slate-400 mt-1">
                      {formatCurrency(debt.guarantorLiabilityAmount)} paid
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
