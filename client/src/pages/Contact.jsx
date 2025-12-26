import React, { useState } from "react";
import { notifications as notificationsApi } from "../api/api";
import toast from "react-hot-toast";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill name, email and message");
      return;
    }
    setLoading(true);
    try {
      try {
        await notificationsApi.create({
          title: form.subject || "Contact message",
          body: `${form.message}\nFrom: ${form.name} <${form.email}>`,
        });
        toast.success("Message submitted. We'll follow up soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
      } catch {
        const mailto = `mailto:support@fintrustchain.example?subject=${encodeURIComponent(
          form.subject || "Contact"
        )}&body=${encodeURIComponent(
          form.message + "\n\nFrom: " + form.name + " <" + form.email + ">"
        )}`;
        window.location.href = mailto;
        toast("Opening your email client...");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get In{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about FinTrustChain? We're here to help. Send us a
            message and our team will respond promptly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-6">
            <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Email Us</h3>
              <p className="text-gray-400 text-sm">
                support@fintrustchain.example
              </p>
              <p className="text-gray-400 text-sm">
                business@fintrustchain.example
              </p>
            </div>

            <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Location</h3>
              <p className="text-gray-400 text-sm">Online Platform</p>
              <p className="text-gray-400 text-sm">Serving users worldwide</p>
            </div>

            <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Response Time</h3>
              <p className="text-gray-400 text-sm">
                We typically respond within
              </p>
              <p className="text-gray-400 text-sm font-medium text-white">
                24-48 hours
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Send a Message
              </h2>

              <form onSubmit={submit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-[#1214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#1214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="How can we help?"
                      className="w-full pl-11 pr-4 py-3 bg-[#1214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-4 py-3 bg-[#1214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "How long does verification take?",
                a: "Email verification is instant. Profile verification typically takes 24-48 hours after submitting required documents.",
              },
              {
                q: "Is my information secure?",
                a: "Yes, we use industry-standard encryption and never share your personal data with third parties without consent.",
              },
              {
                q: "Can I be both a lender and receiver?",
                a: "Absolutely! You can switch between roles from your dashboard and participate in the platform from both perspectives.",
              },
              {
                q: "What if I have a dispute?",
                a: "Contact our support team with your contract details. We'll review the case and help mediate a resolution.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6"
              >
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
