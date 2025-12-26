import React from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for getting started with microlending",
      icon: Zap,
      color: "indigo",
      features: [
        "Create up to 5 loan brochures",
        "Basic Trust Index tracking",
        "Email support",
        "Standard contract templates",
        "Community forum access",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "For active lenders and frequent borrowers",
      icon: Sparkles,
      color: "purple",
      features: [
        "Unlimited loan brochures",
        "Advanced analytics dashboard",
        "Priority support",
        "Custom contract templates",
        "Guarantor network access",
        "Detailed payment reports",
        "EMI calculator tools",
      ],
      cta: "Coming Soon",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For organizations and institutional lenders",
      icon: Crown,
      color: "amber",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "API access",
        "White-label options",
        "Custom integrations",
        "Bulk loan processing",
        "Advanced security features",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full mb-4">
            Beta Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            FinTrustChain is free during beta. When we launch paid plans, you'll
            get early-adopter benefits.
          </p>
        </div>

        {/* Beta Notice */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-12 text-center">
          <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Currently in Beta
          </h3>
          <p className="text-gray-400 max-w-xl mx-auto">
            All features are free while we're in beta. Help us improve the
            platform and lock in exclusive benefits when we launch paid tiers.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-slate-800/50 border rounded-2xl p-8 ${
                plan.popular
                  ? "border-purple-500/50 shadow-lg shadow-purple-500/10"
                  : "border-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div
                className={`w-12 h-12 bg-${plan.color}-500/20 rounded-xl flex items-center justify-center mb-6`}
              >
                <plan.icon className={`w-6 h-6 text-${plan.color}-400`} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-[#1a2332] hover:bg-slate-600 text-white"
                }`}
                disabled={plan.cta === "Coming Soon"}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <h4 className="font-semibold text-white mb-2">No Hidden Fees</h4>
            <p className="text-gray-400 text-sm">
              What you see is what you pay. No surprise charges or hidden costs.
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-white mb-2">Cancel Anytime</h4>
            <p className="text-gray-400 text-sm">
              No long-term commitments. Cancel your subscription whenever you
              want.
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-white mb-2">Secure Payments</h4>
            <p className="text-gray-400 text-sm">
              All transactions are encrypted and processed through secure
              payment gateways.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Pricing FAQ
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Is FinTrustChain really free?",
                a: "Yes! During beta, all features are completely free. We may introduce premium tiers later with advanced features.",
              },
              {
                q: "What happens when beta ends?",
                a: "Beta users will receive exclusive discounts and early access to premium features. Your data and history will be preserved.",
              },
              {
                q: "Are there transaction fees?",
                a: "Currently no. In the future, we may charge a small percentage on successful loan settlements.",
              },
              {
                q: "Can I switch plans later?",
                a: "Absolutely. You can upgrade or downgrade your plan at any time when paid tiers are available.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
