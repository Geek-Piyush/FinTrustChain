import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscription } from "../api/api";
import toast from "react-hot-toast";
import { Crown, Check, Zap, Shield, IndianRupee, Lock } from "lucide-react";

const PLANS = [
  {
    plan: "RECEIVER",
    title: "Receiver Premium",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-500/20",
    pricing: {
      BIMONTHLY: { amount: 99, label: "₹99 / 2 months" },
      ANNUAL: { amount: 499, label: "₹499 / year", save: "Save ₹100" },
    },
    benefits: [
      "No convenience fee on EMI payments",
      "+1 TrustIndex tier loan access",
      "Priority support",
    ],
  },
  {
    plan: "LENDER",
    title: "Lender Premium",
    icon: Shield,
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500/20",
    pricing: {
      BIMONTHLY: { amount: 199, label: "₹199 / 2 months" },
      ANNUAL: { amount: 999, label: "₹999 / year", save: "Save ₹200" },
    },
    benefits: [
      "No platform fee (2% waived)",
      "2× loan limit (up to ₹40,000)",
      "Premium lender badge",
    ],
  },
];

export default function PremiumPlans() {
  const { user, refreshUser } = useAuth();
  const [duration, setDuration] = useState("BIMONTHLY");
  const [subscribing, setSubscribing] = useState(null);

  const userRole = user?.currentRole; // "RECEIVER" | "LENDER"

  const handleSubscribe = async (plan) => {
    setSubscribing(plan);
    try {
      const { data } = await subscription.subscribe(plan, duration);
      const redirectUrl = data?.data?.redirectUrl;
      if (redirectUrl) {
        // PhonePe gateway — navigate away (don't reset subscribing)
        window.location.href = redirectUrl;
      } else {
        // Direct-activation mode — refresh user and show success
        toast.success(data.message || "Premium plan activated!");
        if (refreshUser) await refreshUser();
        setSubscribing(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Subscription failed.");
      setSubscribing(null);
    }
  };

  const isActivePlan = (plan) =>
    user?.premium?.active && user?.premium?.plan === plan;

  const isPlanLocked = (plan) => userRole && userRole !== plan;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Premium
            </span>{" "}
            Plans
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Unlock exclusive benefits — lower fees, higher limits, and priority access.
          </p>
        </div>

        {/* Duration Toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setDuration("BIMONTHLY")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${duration === "BIMONTHLY"
              ? "bg-blue-600 text-white"
              : "bg-[#0d1117]/50 text-gray-400 border border-white/10 hover:text-gray-300"
              }`}
          >
            Bimonthly
          </button>
          <button
            onClick={() => setDuration("ANNUAL")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${duration === "ANNUAL"
              ? "bg-blue-600 text-white"
              : "bg-[#0d1117]/50 text-gray-400 border border-white/10 hover:text-gray-300"
              }`}
          >
            Annual
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              Save more
            </span>
          </button>
        </div>

        {/* Current plan badge */}
        {user?.premium?.active && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-8 text-center">
            <p className="text-purple-400 font-medium">
              <Crown className="w-4 h-4 inline mr-1 mb-0.5" />
              Active: {user.premium.plan} {user.premium.duration} plan
              {user.premium.expiresAt && (
                <span className="text-gray-400 font-normal ml-2">
                  · Expires {new Date(user.premium.expiresAt).toLocaleDateString("en-IN")}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Role info banner */}
        {userRole && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 text-center">
            <p className="text-gray-400 text-sm">
              You are currently in{" "}
              <span className="text-white font-semibold">{userRole}</span> mode.
              {" "}Only the{" "}
              <span className="text-white font-semibold">{userRole} Premium</span>{" "}
              plan is available. Switch roles in your profile to access the other plan.
            </p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map(({ plan, title, icon: Icon, color, border, pricing, benefits }) => {
            const active = isActivePlan(plan);
            const locked = isPlanLocked(plan);
            const p = pricing[duration];
            return (
              <div
                key={plan}
                className={`relative bg-[#1a2332]/40 ${border} border rounded-3xl p-8 flex flex-col transition-all ${active ? "ring-2 ring-purple-500/30" : ""}
                  ${locked ? "opacity-50 grayscale" : ""}`}
              >
                {active && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                    ACTIVE
                  </div>
                )}
                {locked && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-700 text-gray-300 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Switch to {plan} mode
                  </div>
                )}

                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-white">₹{p.amount}</span>
                  <span className="text-gray-400 text-sm">
                    / {duration === "BIMONTHLY" ? "2 months" : "year"}
                  </span>
                </div>
                {p.save && (
                  <p className="text-green-400 text-sm font-medium mb-5">{p.save}</p>
                )}
                {!p.save && <div className="mb-5" />}

                <ul className="space-y-3 mb-8 flex-1">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !locked && !active && handleSubscribe(plan)}
                  disabled={subscribing === plan || active || locked}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${active
                    ? "bg-purple-500/10 text-purple-400 cursor-default"
                    : locked
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : `bg-gradient-to-r ${color} text-white hover:opacity-90 disabled:opacity-50`
                    }`}
                >
                  {subscribing === plan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting to PhonePe…
                    </>
                  ) : active ? (
                    "Current Plan"
                  ) : locked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Switch to {plan} mode first
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-4 h-4" />
                      Pay ₹{p.amount} via PhonePe
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-8 bg-[#0d1117]/50 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">
            You will be redirected to PhonePe to complete payment. Premium is activated automatically after successful payment.
          </p>
        </div>
      </div>
    </div>
  );
}
