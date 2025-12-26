import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { users } from "../api/api";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getAvatarUrl } from "../utils/imageUtils";

export default function UpdateProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState(user?.bio || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!upiId || !upiId.trim()) {
      alert("UPI ID is required for transactions");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      formData.append("upiId", upiId);
      formData.append("bio", bio);

      console.log("Sending update request with:", {
        hasAvatar: !!avatarFile,
        upiId,
        bio,
      });

      const response = await users.updateMe(formData);
      console.log("Update response:", response);

      await refreshUser();
      alert("Profile updated successfully!");
      // Navigate and force reload to show updated data
      navigate("/profile");
      window.location.reload();
    } catch (err) {
      console.error("Profile update failed", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile. Please check your connection.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarUrl = previewUrl || getAvatarUrl(user?.avatarUrl);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Update Profile</h1>
        <p className="text-slate-400 mb-8">
          Keep your information up to date for smooth transactions
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6"
        >
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Profile Photo
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border-2 border-white/20">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-500">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-white
                    hover:file:bg-blue-600
                    file:cursor-pointer cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Tell us about yourself..."
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {bio.length}/500 characters
            </div>
          </div>

          {/* UPI ID - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              UPI ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="yourname@upi"
            />
            <div className="flex items-start gap-2 mt-2">
              <svg
                className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-gray-400">
                Required for loan disbursements and repayments. Make sure this
                UPI ID is active and linked to your bank account.
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Profile"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
