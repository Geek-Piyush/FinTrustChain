import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Bell, LogOut, ChevronDown, User, Crown, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notifications as notificationsApi } from "../api/api";
import { getAvatarUrl } from "../utils/imageUtils";

const receiverTabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/brochures", label: "Brochures" },
  { to: "/debts", label: "Debts" },
  { to: "/premium", label: "Premium" },
  { to: "/support", label: "Support" },
  { to: "/how-it-works", label: "Guide" },
];

const lenderTabs = [
  { to: "/lender-dashboard", label: "Dashboard" },
  { to: "/create-brochure", label: "Create Brochure" },
  { to: "/debts", label: "Debts" },
  { to: "/premium", label: "Premium" },
  { to: "/support", label: "Support" },
  { to: "/how-it-works", label: "Guide" },
];

const publicTabs = [
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How It Works" },
];

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  // const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const baseTabs = user
    ? user?.currentRole === "LENDER"
      ? lenderTabs
      : receiverTabs
    : publicTabs;

  // Add Admin tab if user is an admin
  const tabs = user?.role === "ADMIN"
    ? [...baseTabs, { to: "/admin", label: "Admin" }]
    : baseTabs;

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);

    const loadUnreadCount = async () => {
      if (user) {
        try {
          const res = await notificationsApi.getUnreadCount();
          setUnreadCount(res.data?.data?.count || res.data?.count || 0);
        } catch {
          // Silently fail
        }
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <header
      className={`fixed z-50 transition-all duration-300 left-0 right-0 ${isSticky
          ? "top-0 bg-slate-900/95 border-b border-white/10 shadow-lg shadow-black/20"
          : "top-4 mx-4 md:mx-8 lg:mx-16 rounded-2xl bg-slate-900/80 border border-white/10"
        } backdrop-blur-xl`}
    >
      <nav className="px-4 md:px-6 flex items-center justify-between max-w-7xl mx-auto h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/Logo.png"
            alt="FinTrustChain"
            className="w-9 h-9 rounded-xl object-contain"
          />
          <span className="font-semibold text-white text-lg hidden sm:block">
            FinTrustChain
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Bell size={20} className="text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {(user.name || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[100px] truncate">
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-xl shadow-black/30 py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User size={16} />
                      View Profile
                    </Link>
                    <Link
                      to="/premium"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Crown size={16} />
                      Premium Plans
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      >
                        <ShieldCheck size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="md:hidden p-2.5 rounded-xl hover:bg-white/10 text-white transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FT</span>
                </div>
                <span className="text-white font-semibold">FinTrustChain</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {tabs.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  onClick={() => setSidebarOpen(false)}
                  className="px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium"
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-white/10">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img
                          src={getAvatarUrl(user.avatarUrl)}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {(user.name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User size={18} />
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 rounded-xl border border-white/10 text-center text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 rounded-xl bg-indigo-600 text-center text-white hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
