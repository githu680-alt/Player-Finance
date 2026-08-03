import React from 'react';
import { LogOut } from 'lucide-react';

interface AboutTabProps {
  onLogout?: () => void;
}

const AboutTab: React.FC<AboutTabProps> = ({ onLogout }) => {
  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 shadow-sm border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : null}
          </div>
          <p className="text-slate-500">Version 1.0.0</p>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">About Player Finance</h2>
          <p className="text-slate-600 leading-relaxed">
            Player Finance is a comprehensive financial management system designed for managing players, transactions, and business accounts. Built for real-time synchronization with offline-first support, ensuring your data is always accessible.
          </p>
        </div>

        {/* Developer Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Developed by</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
              YN
            </div>
            <div>
              <p className="font-semibold text-slate-900">Ye Htun Naing</p>
              <p className="text-sm text-slate-500">Developer & Architect</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Built by Ye Htun Naing with a polished finance-first UI and reliable data sync.</p>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-blue-600 font-semibold">●</span> React 18
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-green-600 font-semibold">●</span> Vite
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-purple-600 font-semibold">●</span> Capacitor
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-orange-600 font-semibold">●</span> Firebase
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-red-600 font-semibold">●</span> Android Studio
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-slate-600 font-semibold">●</span> TypeScript
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-cyan-600 font-semibold">●</span> Tailwind CSS
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-indigo-600 font-semibold">●</span> IndexedDB
            </div>
          </div>
        </div>

        {/* AI Assisted Development */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span> AI Assisted Development
          </h2>
          <p className="text-slate-700">
            Built with support from <span className="font-semibold">OpenAI ChatGPT</span>, enabling efficient development and code quality optimization.
          </p>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h2>
          <ul className="space-y-2 text-slate-700">
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Real-time transaction management</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Offline-first architecture with automatic sync</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Multi-account business management</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Owner private finance with encryption</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Player and bill transaction tracking</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Analytics and reporting</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Cross-device synchronization</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">
            © 2026 Player Finance. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Made with <span className="text-red-500">❤</span> for financial excellence
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutTab;
