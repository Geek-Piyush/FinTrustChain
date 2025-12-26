import React from "react";
import { Link } from "react-router-dom";
import { Target, Eye, Users, Shield, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <main className="min-h-screen pt-24 pb-12">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FinTrustChain
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto">
            FinTrustChain is a decentralized-inspired trust scoring and loan
            matchmaking platform that helps lenders and receivers connect
            directly. We combine signature verification, trust indexes and
            community endorsements to minimize friction and fraud in small-value
            lending.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
              <Target size={28} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed">
              To make credit accessible by building transparent trust signals
              and simple tools for lenders and borrowers. We believe in
              empowering communities through peer-to-peer lending backed by
              reputation and mutual trust.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Eye size={28} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
            <ol className="space-y-3 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  1
                </span>
                Sign up and verify your e-signature image
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  2
                </span>
                Build trust through endorsements and on-time repayments
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  3
                </span>
                Browse or create loan brochures
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  4
                </span>
                Apply with guarantors and settle via the platform
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-gradient-to-b from-indigo-950/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="text-blue-400" size={24} />,
                title: "Trust Index System",
                desc: "Score from 0-950 that measures your financial reliability based on repayments and community endorsements.",
              },
              {
                icon: <Shield className="text-emerald-400" size={24} />,
                title: "Guarantor Protection",
                desc: "Every loan requires a guarantor who backs the borrower, providing additional security for lenders.",
              },
              {
                icon: <Target className="text-amber-400" size={24} />,
                title: "Digital Contracts",
                desc: "Three-way contracts with e-signatures ensure all parties are legally bound and protected.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/50 border border-white/5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
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

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "FinTrustChain helped me access a small loan when banks said no. The endorsement system is solid.",
                author: "A. Kumar",
              },
              {
                quote:
                  "As a lender, I can manage risk better using the Trust Index. Platform is lightweight and trustworthy.",
                author: "S. Mehta",
              },
              {
                quote:
                  "Fast onboarding and the e-sign feature is very convenient. Support was responsive.",
                author: "R. Patel",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/50 border border-white/5"
              >
                <p className="text-slate-300 mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="font-medium text-white">— {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-400 mb-8">
            Join our community and start building your trust score today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all"
          >
            Create Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}
