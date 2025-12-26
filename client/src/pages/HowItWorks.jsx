import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function HowItWorks() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FinTrustChain
            </span>{" "}
            Works
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 mb-8">
          <p className="text-slate-300 leading-relaxed">
            FinTrustChain is an app for decentralized unsecured loans based on
            community trust. We mimic the credit score system using our
            TrustIndex metric and have incorporated an endorsement system that
            leverages community connections. This platform enables users to
            quickly access loans without traditional collateral, relying instead
            on social trust and reputation within the community.
          </p>
        </div>

        {/* Key Features */}
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                1. Endorsement System
              </h3>
              <ul className="space-y-2 text-slate-300 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-emerald-400 mt-1 flex-shrink-0"
                  />
                  Search and endorse users by their User ID
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-emerald-400 mt-1 flex-shrink-0"
                  />
                  Bidirectional endorsement - when you endorse someone, they
                  become your endorser too
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-emerald-400 mt-1 flex-shrink-0"
                  />
                  Maximum of 4 new endorsements per month
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-emerald-400 mt-1 flex-shrink-0"
                  />
                  Gain or lose TrustIndex based on endorsement activities
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                2. Guarantor System
              </h3>
              <p className="text-slate-300 ml-4">
                If a receiver is unable to pay the loan within the first 28 days
                of default, the loan responsibility will be transferred to their
                guarantor, providing an additional layer of security for
                lenders.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                3. Dual Role Profiles
              </h3>
              <p className="text-slate-300 ml-4">
                Every user has 2 profiles - Lender and Receiver. You can toggle
                between them, but you can only have one active role at a time.
                If you have an ongoing loan as a receiver, you can't lend money
                as a lender and vice versa.
              </p>
            </div>
          </div>
        </div>

        {/* Loan Process */}
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Loan Process Workflow
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                Step 1: Browse Loan Brochures
              </h3>
              <p className="text-slate-300 mb-3">
                Lenders post loan brochures containing:
              </p>
              <ul className="space-y-2 text-slate-400 ml-4">
                <li>• Loan amount available</li>
                <li>• Interest rate</li>
                <li>• Repayment timeline (in days)</li>
                <li>
                  • Historical data (loans given, acceptance ratio, total amount
                  lent)
                </li>
              </ul>
              <p className="text-slate-300 mt-3">
                Receivers can browse brochures filtered by their TrustIndex
                eligibility.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                Step 2: Submit Loan Request
              </h3>
              <p className="text-slate-300">
                Receivers can select up to 3 lenders at a time. Whichever lender
                accepts first gets connected, and the request expires for other
                lenders (First-Come-First-Served basis).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                Step 3: Contract Signing
              </h3>
              <p className="text-slate-300 mb-3">
                Once a lender accepts, a standard 3-page contract is generated:
              </p>
              <ul className="space-y-2 text-slate-400 ml-4">
                <li>
                  <span className="text-white font-medium">
                    Page 1 (Receiver):
                  </span>{" "}
                  Acceptance of lender's agreement and standard terms
                </li>
                <li>
                  <span className="text-white font-medium">
                    Page 2 (Guarantor):
                  </span>{" "}
                  Agreement in case of default
                </li>
                <li>
                  <span className="text-white font-medium">
                    Page 3 (Lender):
                  </span>{" "}
                  Acceptance of the request
                </li>
              </ul>
              <p className="text-slate-300 mt-3">
                Each party must sign with their e-signature. Each contract has a
                unique ID.
              </p>
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="text-amber-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-amber-200">
                  If any party cancels or the guarantor rejects, the entire
                  contract is cancelled.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                Step 4: Loan Disbursal
              </h3>
              <p className="text-slate-300">
                Once all three parties sign, the lender disburses the funds. As
                soon as the money is sent, the loan repayment countdown begins.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                Step 5: Repayment
              </h3>
              <p className="text-slate-300">
                Receivers repay according to the schedule. On-time payments
                improve Trust Index for all parties involved. Late payments or
                defaults negatively impact everyone's score.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Index */}
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Trust Index (TI) System
          </h2>
          <div className="space-y-4">
            <p className="text-slate-300">
              The TrustIndex is a score from 0-950 that measures your financial
              reliability on FinTrustChain. Here's how it works:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="font-semibold text-emerald-400 mb-2">
                  TI Increases When:
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ Repaying loans on time</li>
                  <li>✓ Receiving endorsements</li>
                  <li>✓ Endorsees repay their loans</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <h4 className="font-semibold text-rose-400 mb-2">
                  TI Decreases When:
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✗ Defaulting on loans</li>
                  <li>✗ Late payments</li>
                  <li>✗ Endorsees default on their loans</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA - Only show for non-logged-in users */}
        {!user && (
          <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-400 mb-8">
              Create your account and start building your trust score today.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all"
            >
              Create Account
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
