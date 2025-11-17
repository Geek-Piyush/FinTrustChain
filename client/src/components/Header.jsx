import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Bell, LogOut } from "lucide-react";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import { notifications as notificationsApi } from "../api/api";
import { getAvatarUrl } from "../utils/imageUtils";

const receiverTabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/how-it-works", label: "Guide" },
  { to: "/about", label: "About" },
];

const lenderTabs = [
  { to: "/lender-dashboard", label: "Dashboard" },
  { to: "/create-brochure", label: "Create Brochure" },
  { to: "/how-it-works", label: "Guide" },
  { to: "/about", label: "About" },
];

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const tabs = user?.currentRole === "LENDER" ? lenderTabs : receiverTabs;

  const handleLogout = () => {
    logout();
    // No need for navigate - logout handles redirect
  };

  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);

    // Poll for unread notifications
    const loadUnreadCount = async () => {
      if (user) {
        try {
          const res = await notificationsApi.getUnreadCount();
          setUnreadCount(res.data?.data?.count || res.data?.count || 0);
        } catch (err) {
          // Silently fail if notifications endpoint doesn't exist
          // console.error("Failed to load unread count", err);
        }
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Poll every 30s

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div
      className={`fixed z-50 transition-all border-b-4 border-white/10 duration-300 flex justify-center items-center ${
        isSticky
          ? "top-0 left-0 right-0 w-full bg-black/90 shadow-md"
          : "top-8 left-0 right-0 mx-4 md:mx-16 rounded-3xl bg-black/60"
      }`}
    >
      <nav className="px-4 flex m-auto items-center justify-between rounded-3xl gap-4 max-w-[1200px] w-full backdrop-blur-lg py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-10" >
              <img src="/Logo.png" alt="FinTrustChain Logo" />
            </span>
            <span className="font-semibold text-white">FinTrustChain</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                (isActive
                  ? "text-white border-b-2 border-neon"
                  : "text-gray-300 hover:text-white") +
                " px-3 py-2 text-sm font-medium"
              }
            >
              {t.label}
            </NavLink>
          ))}

          {/* Right side: either auth actions or user menu */}
          {user ? (
            <div className="relative group flex items-center gap-3">
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/6 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-sm text-gray-200">
                      {(user.name || "U")[0]}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 text-sm font-medium text-white cursor-pointer">
                  {user.name}
                </div>
              </Link>
              <div className="absolute right-0 mt-2 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all">
                <Button onClick={handleLogout} className="btn-neon px-3 py-2">
                  <LogOut />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 border border-white/6 rounded text-sm text-gray-200 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-neon px-3 py-2 rounded text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-2 rounded bg-white/3 text-white"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-72 bg-black/80 p-4 shadow-xl transform transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="logo-mark" />
                <div className="text-white font-semibold">FinTrustChain</div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-300"
              >
                Close
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {tabs.map(t => (
                <Link
                  key={t.to}
                  to={t.to}
                  onClick={() => setSidebarOpen(false)}
                  className="px-3 py-2 rounded text-gray-200 hover:bg-white/5"
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-white/6 pt-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-white">{user.name}</div>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="btn-neon"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="px-3 py-2 border rounded text-gray-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setSidebarOpen(false)}
                    className="btn-neon px-3 py-2 rounded text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
