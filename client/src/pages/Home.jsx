import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  Shield,
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.currentRole === "LENDER") {
        navigate("/lender-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-lg">Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Zap size={16} className="text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">
                  Trust-Based Lending Platform
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">
                  Decentralized Microcredit Powered by{" "}
                </span>
                <span className="text-blue-400">Community Trust</span>
              </h1>

              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Access loans without collateral using our Trust Index system.
                Build reputation, endorse others, and join a transparent,
                community-powered financial network.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all"
                >
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-white font-medium hover:bg-white/5 transition-all"
                >
                  Learn How It Works
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    No Collateral Required
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    Community Backed
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
              <img
                src="hero-i1.png"
                alt="FinTrustChain"
                className="relative w-full max-w-lg mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How <span className="text-blue-400">FinTrustChain</span> Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our platform combines trust scoring, community endorsements, and
              smart contracts to create a transparent lending ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <TrendingUp className="text-blue-400" size={24} />,
                title: "Trust Index",
                desc: "Build your score (0-950) through timely repayments and endorsements",
              },
              {
                icon: <Users className="text-purple-400" size={24} />,
                title: "Endorsements",
                desc: "Community trust votes with mutual TI gain/loss connection",
              },
              {
                icon: <Shield className="text-emerald-400" size={24} />,
                title: "Guarantor System",
                desc: "Backup protection with shared responsibility for defaults",
              },
              {
                icon: <Zap className="text-amber-400" size={24} />,
                title: "Quick Loans",
                desc: "Browse brochures, apply to multiple lenders, get funded fast",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#1a2332]/40 border border-blue-500/10 hover:border-blue-400/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-950/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                num: "01",
                title: "Sign Up",
                desc: "Create account with e-signature verification",
              },
              {
                num: "02",
                title: "Build Trust",
                desc: "Get endorsements from community members",
              },
              {
                num: "03",
                title: "Browse Loans",
                desc: "Find brochures matching your needs",
              },
              {
                num: "04",
                title: "Apply",
                desc: "Select guarantor and submit request",
              },
              {
                num: "05",
                title: "Get Funded",
                desc: "Receive funds after contract signing",
              },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  {step.num}
                </div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Trusted by <span className="text-blue-400">Our Community</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "FinTrustChain helped me access a small loan when banks said no. The endorsement system is solid.",
                author: "A. Kumar",
                role: "Borrower",
              },
              {
                quote:
                  "As a lender, I can manage risk better using the Trust Index. Platform is lightweight and trustworthy.",
                author: "S. Mehta",
                role: "Lender",
              },
              {
                quote:
                  "Fast onboarding and the e-sign feature is very convenient. Support was responsive.",
                author: "R. Patel",
                role: "Borrower",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#1a2332]/40 border border-blue-500/10"
              >
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-blue-500/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust FinTrustChain for their lending
              needs. No collateral, no complex paperwork.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all"
            >
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
