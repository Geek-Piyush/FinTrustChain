import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  FileText,
  Handshake,
  Users,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Services() {
  const { user } = useAuth();

  const services = [
    {
      icon: <TrendingUp className="text-blue-400" size={28} />,
      title: "Trust Index Calculation",
      desc: "Build and maintain your trust score through timely repayments, endorsements, and positive financial behavior on the platform.",
    },
    {
      icon: <FileText className="text-purple-400" size={28} />,
      title: "Loan Brochure Creation",
      desc: "Lenders can create detailed loan brochures with custom amounts, interest rates, and terms to attract suitable borrowers.",
    },
    {
      icon: <Handshake className="text-emerald-400" size={28} />,
      title: "Smart Matching System",
      desc: "Our platform matches borrowers with lenders based on trust scores, loan requirements, and mutual compatibility.",
    },
    {
      icon: <Users className="text-amber-400" size={28} />,
      title: "Endorsement Network",
      desc: "Build your reputation through community endorsements. Endorse others and receive endorsements to boost your trust score.",
    },
    {
      icon: <Shield className="text-rose-400" size={28} />,
      title: "Guarantor Management",
      desc: "Request and manage guarantors for your loans. Guarantors provide additional security and share in the trust score impact.",
    },
    {
      icon: <Zap className="text-cyan-400" size={28} />,
      title: "Digital Contracts",
      desc: "Secure three-way digital contracts with e-signatures ensure all parties are protected and agreements are legally binding.",
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Services
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need for transparent, trust-based peer-to-peer
            lending
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {service.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA - Only show for non-logged-in users */}
        {!user && (
          <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to experience these services?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join FinTrustChain today and start building your financial
              reputation.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
