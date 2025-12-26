import React, { useEffect, useState } from "react";
import { brochures } from "../api/api";
import { FileText, Percent, Clock, User } from "lucide-react";

export default function LoanBrochures() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await brochures.list();
        const data = res?.data;
        const arr =
          data?.data?.brochures || data?.brochures || data?.data || data || [];
        setItems(Array.isArray(arr) ? arr : []);
      } catch (err) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Loan Brochures</h1>
          <p className="text-gray-400">
            Browse available loan offers from verified lenders
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-[#1a2332]/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No Brochures Available
            </h3>
            <p className="text-gray-400">
              Check back later for new loan offers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((b) => (
              <div
                key={b._id || b.id}
                className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6 hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">
                    ₹{b.amount?.toLocaleString()}
                  </h3>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                    {b.interestRate}%
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Tenor: {b.tenorDays} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <User className="w-4 h-4" />
                    <span>Lender: {b.lender?.name || "—"}</span>
                  </div>
                </div>

                {b.description && (
                  <p className="text-gray-500 text-sm border-t border-white/5 pt-4">
                    {b.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
