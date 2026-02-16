import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { support as supportApi } from "../api/api";
import toast from "react-hot-toast";
import {
  Send,
  Paperclip,
  X,
  HelpCircle,
  FileText,
  AlertTriangle,
  CreditCard,
  UserX,
  LifeBuoy,
} from "lucide-react";

const CATEGORIES = [
  { value: "Disbursal Dispute", icon: AlertTriangle, color: "text-orange-400" },
  { value: "Payment Issue", icon: CreditCard, color: "text-red-400" },
  { value: "Loan Default Query", icon: FileText, color: "text-yellow-400" },
  { value: "Account Issue", icon: UserX, color: "text-purple-400" },
  { value: "Other", icon: HelpCircle, color: "text-blue-400" },
];

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: "",
    contractId: "",
    description: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const totalFiles = files.length + selected.length;

    if (totalFiles > 3) {
      toast.error("Maximum 3 attachments allowed.");
      return;
    }

    const oversized = selected.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Each file must be under 5 MB.");
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = ""; // reset input
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.subject) {
      toast.error("Please select a category.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please describe your issue.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subject", form.subject);
      fd.append("description", form.description.trim());
      if (form.contractId.trim()) {
        fd.append("contractId", form.contractId.trim());
      }
      files.forEach((f) => fd.append("attachments", f));

      await supportApi.submit(fd);

      toast.success("Support ticket submitted!");
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──
  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="bg-[#1a2332]/40 border border-green-500/20 rounded-3xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <LifeBuoy className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Ticket Submitted
          </h2>
          <p className="text-gray-400 mb-6">
            We've received your support request and will get back to you at{" "}
            <span className="text-white font-medium">{user?.email}</span> within
            24-48 hours.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ subject: "", contractId: "", description: "" });
              setFiles([]);
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Support
            </span>{" "}
            Center
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Having trouble with a transaction, dispute, or your account? Submit
            a ticket and our team will assist you.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-8">
          <form onSubmit={submit} className="space-y-6">
            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = form.subject === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, subject: cat.value })
                      }
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        active
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-white/10 bg-[#0d1117]/50 text-gray-400 hover:border-white/20 hover:text-gray-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-blue-400" : cat.color}`} />
                      {cat.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contract ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contract ID{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.contractId}
                onChange={(e) =>
                  setForm({ ...form, contractId: e.target.value })
                }
                placeholder="e.g. C-2026-02-11-abcd-efgh"
                className="w-full px-4 py-3 bg-[#0d1117]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe Your Issue <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={6}
                placeholder="Please include as much detail as possible — what happened, when, and any steps you've already tried..."
                className="w-full px-4 py-3 bg-[#0d1117]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachments{" "}
                <span className="text-gray-500 font-normal">
                  (max 3 images, 5 MB each)
                </span>
              </label>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 mb-3">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-[#0d1117]/50 border border-white/10 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-300 truncate">
                        <Paperclip className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-gray-500 flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length < 3 && (
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-xl text-gray-400 hover:border-blue-500/50 hover:text-gray-300 transition-colors cursor-pointer">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-sm">
                    {files.length === 0
                      ? "Add screenshots or proof images"
                      : "Add another image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User info badge */}
            <div className="bg-[#0d1117]/50 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                {user?.name?.charAt(0) || "?"}
              </div>
              <div className="text-sm">
                <p className="text-gray-300 font-medium">{user?.name}</p>
                <p className="text-gray-500">{user?.email}</p>
              </div>
              <p className="ml-auto text-gray-600 text-xs">Reply will be sent to this email</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
