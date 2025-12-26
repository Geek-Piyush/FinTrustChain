import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { users as usersApi, endorsements, dashboard } from "../api/api";
import { useNavigate } from "react-router-dom";
import TrustIndexHistory from "../components/TrustIndexHistory";
import Loader from "../components/Loader";
import { getAvatarUrl } from "../utils/imageUtils";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [canToggle, setCanToggle] = useState(true);
  const [endorsementsGiven, setEndorsementsGiven] = useState([]);
  const [endorsementsReceived, setEndorsementsReceived] = useState([]);
  const [endorsersList, setEndorsersList] = useState([]);
  const [endorseesList, setEndorseesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endorsing, setEndorsing] = useState(null);
  const [removingEndorsee, setRemovingEndorsee] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    // Refresh user data from server to get latest updates
    await refreshUser();
    try {
      const [givenRes, receivedRes, endorsersRes, endorseesRes] =
        await Promise.all([
          endorsements
            .given()
            .catch(() => ({ data: { data: { endorsements: [] } } })),
          endorsements
            .received()
            .catch(() => ({ data: { data: { endorsements: [] } } })),
          dashboard
            .myEndorsers()
            .catch(() => ({ data: { data: { endorsers: [] } } })),
          dashboard
            .myEndorsees()
            .catch(() => ({ data: { data: { endorsees: [] } } })),
        ]);

      setEndorsementsGiven(
        givenRes.data?.data?.endorsements || givenRes.data?.endorsements || []
      );
      setEndorsementsReceived(
        receivedRes.data?.data?.endorsements ||
          receivedRes.data?.endorsements ||
          []
      );
      setEndorsersList(
        endorsersRes.data?.data?.endorsers || endorsersRes.data?.endorsers || []
      );
      setEndorseesList(
        endorseesRes.data?.data?.endorsees || endorseesRes.data?.endorsees || []
      );
    } catch (err) {
      console.error("Failed to load endorsements", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async () => {
    setToggling(true);
    setToggleError("");
    try {
      await usersApi.toggleRole();
      await refreshUser();
      alert("Role switched successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to switch role";
      setToggleError(errorMsg);
      setCanToggle(false);
      alert(errorMsg);
    } finally {
      setToggling(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      // Search by User ID using the public profile endpoint
      const res = await usersApi.getPublic(searchQuery.trim());
      // Wrap single user in array for consistent rendering
      setSearchResults([res.data?.data?.user || res.data?.user]);
    } catch (err) {
      console.error("Search failed", err);
      alert(err.response?.data?.message || "User not found with this ID");
      setSearchResults([]);
    }
  };

  const handleEndorse = async (userId) => {
    setEndorsing(userId);
    try {
      await endorsements.create({ receiverId: userId });
      alert("User endorsed successfully!");
      loadProfile();
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to endorse user");
    } finally {
      setEndorsing(null);
    }
  };

  const handleUnendorse = async (userId) => {
    if (!confirm("Are you sure you want to un-endorse this user?")) return;
    setRemovingEndorsee(userId);
    try {
      await endorsements.remove(userId);
      alert("User un-endorsed successfully!");
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to un-endorse user");
    } finally {
      setRemovingEndorsee(null);
    }
  };

  const getTIColor = (ti) => {
    if (ti >= 800) return "text-emerald-400";
    if (ti >= 600) return "text-green-400";
    if (ti >= 500) return "text-yellow-400";
    if (ti >= 400) return "text-orange-400";
    return "text-red-400";
  };

  const needsUpiId = !user?.upiId;
  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* UPI Warning Banner */}
        {needsUpiId && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-yellow-400">
                  ⚠️ Action Required
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Please update your UPI ID to participate in transactions.
                  <button
                    onClick={() => navigate("/update-profile")}
                    className="ml-2 underline hover:text-white"
                  >
                    Update Profile →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-6 items-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-500">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                <div className="text-gray-300 text-sm mt-1">{user?.email}</div>
                <div className="mt-1 text-xs text-gray-400">
                  User ID:{" "}
                  <span className="font-mono text-blue-400 select-all">
                    {user?._id || user?.id}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 items-center">
                  <div className="text-sm">
                    Role:{" "}
                    <span className="font-semibold text-blue-400">
                      {user?.currentRole || user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleRole}
                    disabled={toggling || !canToggle}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {toggling
                      ? "Switching..."
                      : `Toggle to ${
                          user?.currentRole === "RECEIVER"
                            ? "LENDER"
                            : "RECEIVER"
                        }`}
                  </button>
                </div>
                {toggleError && (
                  <div className="mt-2 text-xs text-red-400">
                    ⚠️ {toggleError}
                  </div>
                )}
              </div>
            </div>

            {/* Trust Index Card */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-lg p-6 text-center min-w-[180px]">
              <div className="text-gray-300 text-sm mb-1">Trust Index</div>
              <div
                className={`text-5xl font-bold ${getTIColor(user?.trustIndex)}`}
              >
                {user?.trustIndex ?? 400}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {user?.trustIndex >= 800
                  ? "Excellent"
                  : user?.trustIndex >= 600
                  ? "Good"
                  : user?.trustIndex >= 500
                  ? "Fair"
                  : user?.trustIndex >= 400
                  ? "Low"
                  : "Very Low"}
              </div>
            </div>
          </div>
        </div>

        {/* Bio & UPI Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="font-semibold text-white mb-3">Bio</h2>
            <p className="text-gray-300 text-sm">
              {user?.bio || "No bio set. Tell others about yourself!"}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="font-semibold text-white mb-3">Payment Info</h2>
            <div className="text-sm">
              <span className="text-gray-400">UPI ID:</span>
              <span className="ml-2 font-mono text-white">
                {user?.upiId || <span className="text-red-400">Not set</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Endorsements Section */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Endorsements
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Endorsements Received */}
            <div>
              <h3 className="font-medium text-gray-300 mb-3">
                Received ({endorsementsReceived.length})
              </h3>
              {endorsementsReceived.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No endorsements received yet
                </div>
              ) : (
                <div className="space-y-2">
                  {endorsementsReceived.map((e, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                        {e.endorser?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {e.endorser?.name}
                        </div>
                        <div
                          className={`text-xs ${getTIColor(
                            e.endorser?.trustIndex
                          )}`}
                        >
                          TI: {e.endorser?.trustIndex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Endorsements Given */}
            <div>
              <h3 className="font-medium text-gray-300 mb-3">
                Given ({endorsementsGiven.length})
              </h3>
              {endorsementsGiven.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  You haven't endorsed anyone yet
                </div>
              ) : (
                <div className="space-y-2">
                  {endorsementsGiven.map((e, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                        {e.endorsedUser?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {e.endorsedUser?.name}
                        </div>
                        <div
                          className={`text-xs ${getTIColor(
                            e.endorsedUser?.trustIndex
                          )}`}
                        >
                          TI: {e.endorsedUser?.trustIndex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search & Endorse Users */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium text-gray-300 mb-3">
              Search & Endorse User by ID
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              You can only search users by their User ID. Ask them to share
              their ID with you.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter User ID (e.g., 68ffa652ba7a9424713795bd)..."
                className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
              >
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser._id}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                        {searchUser.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {searchUser.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {searchUser.email}
                        </div>
                        <div
                          className={`text-sm font-semibold ${getTIColor(
                            searchUser.trustIndex
                          )}`}
                        >
                          TI: {searchUser.trustIndex}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndorse(searchUser._id)}
                      disabled={endorsing === searchUser._id}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {endorsing === searchUser._id
                        ? "Endorsing..."
                        : "Endorse"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Update Profile Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/update-profile")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Update Profile
          </button>
        </div>

        {/* My Endorsers List (People who endorsed me - Read Only) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            My Endorsers ({endorsersList.length})
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            People who have endorsed you. You cannot remove these endorsements.
          </p>
          {endorsersList.length === 0 ? (
            <p className="text-gray-400 text-sm">No endorsers yet.</p>
          ) : (
            <div className="space-y-2">
              {endorsersList.map((endorser) => (
                <div
                  key={endorser._id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold">
                      {endorser.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {endorser.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {endorser.email}
                      </div>
                      <div
                        className={`text-sm font-semibold ${getTIColor(
                          endorser.trustIndex
                        )}`}
                      >
                        TI: {endorser.trustIndex}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Endorsees List (People I endorsed - Can Un-endorse) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            My Endorsees ({endorseesList.length})
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            People you have endorsed. You can un-endorse them if needed.
          </p>
          {endorseesList.length === 0 ? (
            <p className="text-gray-400 text-sm">
              You haven't endorsed anyone yet.
            </p>
          ) : (
            <div className="space-y-2">
              {endorseesList.map((endorsee) => (
                <div
                  key={endorsee._id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                      {endorsee.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {endorsee.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {endorsee.email || ""}
                      </div>
                      <div
                        className={`text-sm font-semibold ${getTIColor(
                          endorsee.trustIndex || 0
                        )}`}
                      >
                        TI: {endorsee.trustIndex || 0}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnendorse(endorsee._id)}
                    disabled={removingEndorsee === endorsee._id}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {removingEndorsee === endorsee._id
                      ? "Un-endorsing..."
                      : "Un-endorse"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TrustIndex History */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            TrustIndex History
          </h2>
          <TrustIndexHistory />
        </div>
      </div>
    </div>
  );
}
