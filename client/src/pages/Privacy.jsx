import React from "react";
import {
  Shield,
  Eye,
  Lock,
  Database,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information: Name, email address, and profile details you provide during registration",
        "Identity verification: E-signature images and verification documents",
        "Financial data: Loan requests, payment history, and transaction records",
        "Usage data: How you interact with our platform, pages visited, and features used",
        "Device information: Browser type, IP address, and device identifiers",
      ],
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "To create and manage your FinTrustChain account",
        "To facilitate loan transactions between lenders and receivers",
        "To calculate and maintain Trust Index scores",
        "To verify your identity and prevent fraud",
        "To communicate important updates and notifications",
        "To improve our platform and develop new features",
      ],
    },
    {
      icon: UserCheck,
      title: "Information Sharing",
      content: [
        "With other users: Your public profile and Trust Index are visible to potential lenders/receivers",
        "Contract parties: Relevant information is shared with parties involved in your loan contracts",
        "Guarantors: When you request endorsements, necessary information is shared with potential guarantors",
        "Service providers: We may share data with trusted partners who help operate our platform",
        "Legal requirements: When required by law or to protect our rights and users",
      ],
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "Industry-standard SSL/TLS encryption for all data transmission",
        "Secure, encrypted storage for sensitive information like e-signatures",
        "Regular security audits and vulnerability assessments",
        "Access controls limiting who can view your personal data",
        "Continuous monitoring for suspicious activities",
      ],
    },
    {
      icon: Shield,
      title: "Your Rights",
      content: [
        "Access: Request a copy of your personal data we hold",
        "Correction: Update or correct inaccurate information",
        "Deletion: Request deletion of your account and associated data",
        "Portability: Export your data in a standard format",
        "Opt-out: Unsubscribe from marketing communications",
      ],
    },
    {
      icon: AlertTriangle,
      title: "Important Notices",
      content: [
        "E-signatures are stored securely and used only for contract verification",
        "Trust Index history is maintained as part of our lending ecosystem integrity",
        "Deleting your account may affect ongoing contracts and obligations",
        "We retain certain data as required by financial regulations",
        "Third-party links on our platform have their own privacy policies",
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Your privacy matters to us. Learn how we collect, use, and protect
            your information.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Last updated: January 2025
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6 mb-8">
          <p className="text-gray-300 leading-relaxed">
            FinTrustChain ("we," "our," or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our peer-to-peer
            microlending platform. By using FinTrustChain, you agree to the
            collection and use of information in accordance with this policy.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3 ml-14">
                {section.content.map((item, i) => (
                  <li
                    key={i}
                    className="text-gray-400 text-sm leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 text-center">
          <h3 className="text-xl font-semibold text-white mb-3">
            Questions About Privacy?
          </h3>
          <p className="text-gray-400 mb-4">
            If you have any questions or concerns about our privacy practices,
            please contact us.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200"
          >
            Contact Support
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new policy on this page and updating
          the "Last updated" date.
        </p>
      </div>
    </div>
  );
}
