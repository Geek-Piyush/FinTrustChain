import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const tabs = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/pricing", label: "Pricing" },
    { to: "/contact", label: "Contact" },
    { to: "/privacy", label: "Privacy" },
  ];

  const [email, setEmail] = useState("");

  const submitSubscribe = (e) => {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      alert("Please enter a valid email");
      return;
    }
    // Simple subscribe fallback - open mail client
    window.location.href = `mailto:support@fintrustchain.example?subject=Subscribe&body=Please subscribe ${encodeURIComponent(email)}`;
  };

  return (
    <footer className="w-full bg-[#030303] border-t border-white/6 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold neon-text inline-block">FinTrustChain</Link>
            <p className="mt-3 text-sm text-gray-300">A trust-first micro-lending platform connecting lenders and borrowers with transparent reputation signals.</p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 bg-white/6 rounded hover:bg-white/10"><Twitter size={18} /></a>
              <a href="#" className="p-2 bg-white/6 rounded hover:bg-white/10"><Linkedin size={18} /></a>
              <a href="mailto:piyushnas74@gmail.com" className="p-2 bg-white/6 rounded hover:bg-white/10"><Mail size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold neon-text mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {tabs.map(t => (
                <li key={t.to}><Link to={t.to} className="hover:text-white">{t.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold neon-text mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/how-it-works" className="hover:text-white">How it works</Link></li>
              <li><Link to="/brochures" className="hover:text-white">Loan Brochures</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold neon-text mb-3">Subscribe</h4>
            <p className="text-sm text-gray-300">Get product updates and important announcements.</p>
            <form onSubmit={submitSubscribe} className="mt-3 flex gap-2">
              <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" className="flex-1 p-2 rounded bg-white/6 text-white placeholder:text-gray-400" />
              <button className="btn-neon px-3 rounded">Join</button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t border-white/6 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FinTrustChain — Built with care. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
