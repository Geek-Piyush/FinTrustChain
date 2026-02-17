import { useState, useEffect } from "react";
import { admin as adminApi } from "../api/api";
import toast from "react-hot-toast";
import {
  BarChart3,
  Users,
  FileText,
  IndianRupee,
  Crown,
  Search,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-[#1a2332]/40 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Tab Button ──
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
          ? "bg-blue-600 text-white"
          : "bg-[#0d1117]/50 text-gray-400 hover:text-gray-300 border border-white/10"
        }`}
    >
      {children}
    </button>
  );
}

const FEE_TYPES = ["ALL", "PLATFORM_FEE", "CONVENIENCE_FEE", "SUBSCRIPTION"];
const CONTRACT_STATUSES = [
  "ALL",
  "PENDING_SIGNATURES",
  "AWAITING_DISBURSAL",
  "AWAITING_RECEIPT_CONFIRMATION",
  "ACTIVE",
  "REPAID",
  "DEFAULT",
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Revenue state
  const [revenue, setRevenue] = useState([]);
  const [revFilter, setRevFilter] = useState("ALL");
  const [revPage, setRevPage] = useState(1);
  const [revPages, setRevPages] = useState(1);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);

  // Contracts state
  const [contracts, setContracts] = useState([]);
  const [contractSearch, setContractSearch] = useState("");
  const [contractStatus, setContractStatus] = useState("ALL");
  const [contractPage, setContractPage] = useState(1);
  const [contractPages, setContractPages] = useState(1);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminApi.getStats();
        setStats(data.data);
      } catch (err) {
        toast.error("Failed to load admin stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch revenue
  useEffect(() => {
    if (tab !== "revenue") return;
    (async () => {
      try {
        const params = { page: revPage, limit: 15 };
        if (revFilter !== "ALL") params.type = revFilter;
        const { data } = await adminApi.getRevenue(params);
        setRevenue(data.data.entries);
        setRevPages(data.totalPages);
      } catch (err) {
        toast.error("Failed to load revenue.");
      }
    })();
  }, [tab, revFilter, revPage]);

  // Fetch users
  useEffect(() => {
    if (tab !== "users") return;
    const t = setTimeout(async () => {
      try {
        const params = { page: userPage, limit: 15 };
        if (userSearch) params.search = userSearch;
        const { data } = await adminApi.getUsers(params);
        setUsers(data.data.users);
        setUserPages(data.totalPages);
      } catch (err) {
        toast.error("Failed to load users.");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [tab, userSearch, userPage]);

  // Fetch contracts
  useEffect(() => {
    if (tab !== "contracts") return;
    const t = setTimeout(async () => {
      try {
        const params = { page: contractPage, limit: 15 };
        if (contractSearch) params.search = contractSearch;
        if (contractStatus !== "ALL") params.status = contractStatus;
        const { data } = await adminApi.getContracts(params);
        setContracts(data.data.contracts);
        setContractPages(data.totalPages);
      } catch (err) {
        toast.error("Failed to load contracts.");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [tab, contractSearch, contractStatus, contractPage]);

  const handleBlockUser = async (id) => {
    try {
      const { data } = await adminApi.blockUser(id);
      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, status: data.data.user.status } : u
        )
      );
    } catch (err) {
      toast.error("Failed to update user status.");
    }
  };

  const handleContractStatusChange = async (id, newStatus) => {
    try {
      const { data } = await adminApi.updateContractStatus(id, newStatus);
      toast.success(data.message);
      setContracts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update contract.");
    }
  };

  const fmt = (n) =>
    n?.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }) || "₹0";

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Admin
              </span>{" "}
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Platform overview and management</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["overview", "revenue", "users", "contracts"].map((t) => (
              <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabBtn>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && stats && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers}
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                icon={FileText}
                label="Active Contracts"
                value={stats.activeContracts}
                color="bg-green-500/20 text-green-400"
                sub={`${stats.totalContracts} total`}
              />
              <StatCard
                icon={IndianRupee}
                label="Total Revenue"
                value={fmt(stats.revenue?.total)}
                color="bg-amber-500/20 text-amber-400"
                sub={`${fmt(stats.thisMonthRevenue)} this month`}
              />
              <StatCard
                icon={Crown}
                label="Premium Users"
                value={stats.premiumUsers}
                color="bg-purple-500/20 text-purple-400"
              />
            </div>

            {/* Revenue breakdown */}
            <div className="bg-[#1a2332]/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" /> Revenue Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Platform Fees", key: "PLATFORM_FEE", color: "text-amber-400" },
                  { label: "Convenience Fees", key: "CONVENIENCE_FEE", color: "text-blue-400" },
                  { label: "Subscriptions", key: "SUBSCRIPTION", color: "text-purple-400" },
                ].map(({ label, key, color }) => (
                  <div key={key} className="bg-[#0d1117]/50 border border-white/5 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className={`text-xl font-bold ${color} mt-1`}>
                      {fmt(stats.revenue?.[key]?.total || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.revenue?.[key]?.count || 0} entries
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUE ── */}
        {tab === "revenue" && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {FEE_TYPES.map((t) => (
                <TabBtn key={t} active={revFilter === t} onClick={() => { setRevFilter(t); setRevPage(1); }}>
                  {t === "ALL" ? "All" : t.replace(/_/g, " ")}
                </TabBtn>
              ))}
            </div>

            <div className="bg-[#1a2332]/40 border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0d1117]/60">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Description</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {revenue.map((r) => (
                      <tr key={r._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${r.type === "PLATFORM_FEE"
                              ? "bg-amber-500/10 text-amber-400"
                              : r.type === "CONVENIENCE_FEE"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-purple-500/10 text-purple-400"
                            }`}>
                            {r.type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{r.user?.name || "—"}</td>
                        <td className="px-4 py-3 text-green-400 font-medium">{fmt(r.amount)}</td>
                        <td className="px-4 py-3 text-gray-400 truncate max-w-[200px]">
                          {r.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    {revenue.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No revenue entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={revPage} totalPages={revPages} setPage={setRevPage} />
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="bg-[#1a2332]/40 border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0d1117]/60">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">TI</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Capital</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Premium</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.currentRole === "LENDER"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-blue-500/10 text-blue-400"
                            }`}>
                            {u.currentRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{u.trustIndex}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {u.lenderCapital > 0
                            ? `${fmt(u.lenderCapital)} (${fmt(u.lockedCapital)} locked)`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {u.premium?.active ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400">
                              {u.premium.plan}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">Free</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                            }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleBlockUser(u._id)}
                            className={`p-2 rounded-lg transition-colors ${u.status === "ACTIVE"
                                ? "hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                                : "hover:bg-green-500/10 text-gray-400 hover:text-green-400"
                              }`}
                            title={u.status === "ACTIVE" ? "Block User" : "Unblock User"}
                          >
                            {u.status === "ACTIVE" ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={userPage} totalPages={userPages} setPage={setUserPage} />
            </div>
          </div>
        )}

        {/* ── CONTRACTS ── */}
        {tab === "contracts" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={contractSearch}
                  onChange={(e) => { setContractSearch(e.target.value); setContractPage(1); }}
                  placeholder="Search by Contract ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <select
                value={contractStatus}
                onChange={(e) => { setContractStatus(e.target.value); setContractPage(1); }}
                className="px-3 py-2.5 bg-[#0d1117]/50 border border-white/10 rounded-xl text-gray-300 text-sm focus:outline-none focus:border-blue-500"
              >
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#1a2332]/40 border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0d1117]/60">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Contract ID</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Lender</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Receiver</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contracts.map((c) => (
                      <tr key={c._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-blue-400 font-mono text-xs">
                          {c.contractId || c._id.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{c.lender?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{c.receiver?.name || "—"}</td>
                        <td className="px-4 py-3 text-white font-medium">{fmt(c.principal)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleContractStatusChange(c._id, e.target.value);
                            }}
                            className="px-2 py-1 bg-[#0d1117]/50 border border-white/10 rounded-lg text-xs text-gray-400 focus:outline-none"
                          >
                            <option value="">Change status...</option>
                            {CONTRACT_STATUSES.filter((s) => s !== "ALL" && s !== c.status).map(
                              (s) => (
                                <option key={s} value={s}>
                                  {s.replace(/_/g, " ")}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No contracts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={contractPage} totalPages={contractPages} setPage={setContractPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pagination ──
function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
      <button
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }) {
  const colors = {
    PENDING_SIGNATURES: "bg-yellow-500/10 text-yellow-400",
    AWAITING_DISBURSAL: "bg-orange-500/10 text-orange-400",
    AWAITING_RECEIPT_CONFIRMATION: "bg-cyan-500/10 text-cyan-400",
    ACTIVE: "bg-green-500/10 text-green-400",
    REPAID: "bg-blue-500/10 text-blue-400",
    DEFAULT: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[status] || "bg-gray-500/10 text-gray-400"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
