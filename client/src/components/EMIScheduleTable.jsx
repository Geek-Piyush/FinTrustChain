import React from "react";

export default function EMIScheduleTable({
  schedule,
  onPayEMI,
  isReceiver,
  payingEMI,
}) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-gray-400 text-center py-6">
        No EMI schedule available
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      PAID: "bg-green-500/20 text-green-400 border-green-500",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      OVERDUE: "bg-red-500/20 text-red-400 border-red-500",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          statusColors[status] || statusColors.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  const isOverdue = (dueDate, status) => {
    return status === "PENDING" && new Date(dueDate) < new Date();
  };

  // Find the first pending EMI number (only this one gets the Pay button)
  const firstPendingEMI = schedule.find((e) => e.status === "PENDING");
  const firstPendingNumber = firstPendingEMI?.emiNumber;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-3 text-sm font-semibold text-gray-300">
              EMI #
            </th>
            <th className="text-left p-3 text-sm font-semibold text-gray-300">
              Due Date
            </th>
            <th className="text-right p-3 text-sm font-semibold text-gray-300">
              Principal
            </th>
            <th className="text-right p-3 text-sm font-semibold text-gray-300">
              Interest
            </th>
            <th className="text-right p-3 text-sm font-semibold text-gray-300">
              Total EMI
            </th>
            <th className="text-center p-3 text-sm font-semibold text-gray-300">
              Status
            </th>
            {isReceiver && onPayEMI && (
              <th className="text-center p-3 text-sm font-semibold text-gray-300">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {schedule.map((emi, idx) => {
            const overdue = isOverdue(emi.dueDate, emi.status);
            const emiNum = emi.emiNumber || idx + 1;
            const isNextPayable =
              emi.status === "PENDING" && emiNum === firstPendingNumber;

            return (
              <tr
                key={idx}
                className={`border-b border-white/5 ${
                  emi.status === "PAID"
                    ? "bg-green-500/5"
                    : overdue
                    ? "bg-red-500/10"
                    : isNextPayable
                    ? "bg-yellow-500/10"
                    : ""
                }`}
              >
                <td className="p-3 text-sm text-white font-medium">
                  #{emiNum}
                </td>
                <td className="p-3 text-sm text-gray-300">
                  {new Date(emi.dueDate).toLocaleDateString()}
                  {overdue && (
                    <span className="ml-2 text-xs text-red-400">(Overdue)</span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-300 text-right">
                  ₹{emi.principal?.toLocaleString()}
                </td>
                <td className="p-3 text-sm text-gray-300 text-right">
                  ₹{emi.interest?.toLocaleString()}
                </td>
                <td className="p-3 text-sm text-white font-semibold text-right">
                  ₹{(emi.principal + emi.interest).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {getStatusBadge(overdue ? "OVERDUE" : emi.status)}
                </td>
                {isReceiver && onPayEMI && (
                  <td className="p-3 text-center">
                    {isNextPayable ? (
                      <button
                        onClick={() => onPayEMI(emiNum)}
                        disabled={payingEMI === emiNum}
                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
                      >
                        {payingEMI === emiNum ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Paying...
                          </>
                        ) : (
                          "Pay Now"
                        )}
                      </button>
                    ) : emi.status === "PAID" ? (
                      <span className="text-xs text-green-400">✓ Paid</span>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/20 bg-white/5">
            <td colSpan="2" className="p-3 text-sm font-semibold text-white">
              Total
            </td>
            <td className="p-3 text-sm font-semibold text-white text-right">
              ₹
              {schedule
                .reduce((sum, emi) => sum + (emi.principal || 0), 0)
                .toLocaleString()}
            </td>
            <td className="p-3 text-sm font-semibold text-white text-right">
              ₹
              {schedule
                .reduce((sum, emi) => sum + (emi.interest || 0), 0)
                .toLocaleString()}
            </td>
            <td className="p-3 text-sm font-semibold text-white text-right">
              ₹
              {schedule
                .reduce(
                  (sum, emi) =>
                    sum + (emi.principal || 0) + (emi.interest || 0),
                  0
                )
                .toLocaleString()}
            </td>
            <td></td>
            {isReceiver && onPayEMI && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
