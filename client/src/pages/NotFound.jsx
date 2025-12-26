import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold text-slate-800/50 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Search className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
          Oops! The page you're looking for doesn't exist or has been moved to a
          new location.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2332] hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm mb-4">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/dashboard"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/how-it-works"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
