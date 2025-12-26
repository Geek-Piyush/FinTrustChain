import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "../api/api";
import { Bell, BellOff, Trash2, Check } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notifications.list();
      setItems(res.data?.data?.notifications || res.data?.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notifications.markAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notifications.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notifications.delete(id);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === "GUARANTOR_REQUEST") {
      navigate("/dashboard");
    } else if (
      notification.type === "LOAN_REQUEST_ACCEPTED" ||
      notification.type === "CONTRACT_CREATED"
    ) {
      if (notification.data?.contractId) {
        navigate(`/contracts/${notification.data.contractId}`);
      } else {
        navigate("/dashboard");
      }
    } else if (
      notification.type === "PAYMENT_RECEIVED" ||
      notification.type === "EMI_DUE" ||
      notification.type === "EMI_OVERDUE"
    ) {
      navigate("/payments");
    } else {
      navigate("/dashboard");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "GUARANTOR_REQUEST":
        return "🤝";
      case "LOAN_REQUEST_ACCEPTED":
        return "✅";
      case "CONTRACT_CREATED":
        return "📄";
      case "PAYMENT_RECEIVED":
        return "💰";
      case "EMI_DUE":
        return "⏰";
      case "EMI_OVERDUE":
        return "⚠️";
      case "CONTRACT_SIGNED":
        return "✍️";
      case "LOAN_DISBURSED":
        return "💸";
      case "TRUST_INDEX_CHANGE":
        return "📊";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "GUARANTOR_REQUEST":
        return "border-blue-500/30 bg-blue-500/10";
      case "LOAN_REQUEST_ACCEPTED":
      case "PAYMENT_RECEIVED":
      case "CONTRACT_SIGNED":
        return "border-green-500/30 bg-green-500/10";
      case "EMI_OVERDUE":
        return "border-red-500/30 bg-red-500/10";
      case "EMI_DUE":
        return "border-yellow-500/30 bg-yellow-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-gray-400 mt-4">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-400 mt-2">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {items.length > 0 && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Mark All Read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
            <BellOff size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">
              You'll see notifications here when there's activity
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-lg p-4 transition-all cursor-pointer hover:bg-white/10 ${
                  notification.isRead
                    ? "border-white/10 bg-white/5"
                    : getNotificationColor(notification.type)
                } ${!notification.isRead ? "border-l-4" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-300 mt-1 text-sm">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-white/10 rounded">
                          {notification.type?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} className="text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification._id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
