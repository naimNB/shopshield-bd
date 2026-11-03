import React, { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink, Activity, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Navbar: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check backend health
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (res.ok) {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };
    checkHealth();
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-navy-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">ShopShield</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono -mt-0.5">YUNet AIgnite 2026</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#analyzer" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Analyzer</a>
            <a href="#problem-solution" className="hover:text-emerald-400 transition-colors">Why ShopShield</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#preview" className="hover:text-emerald-400 transition-colors">Preview</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action & Status */}
          <div className="hidden sm:flex items-center space-x-4">
            {/* Backend Health Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Backend:</span>
              <span className="flex items-center space-x-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'healthy'
                      ? 'bg-emerald-400 animate-pulse'
                      : backendStatus === 'checking'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span
                  className={
                    backendStatus === 'healthy'
                      ? 'text-emerald-400 font-semibold'
                      : backendStatus === 'checking'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }
                >
                  {backendStatus === 'healthy' ? 'Online' : backendStatus === 'checking' ? 'Connecting' : 'Offline'}
                </span>
              </span>
            </div>

            {/* GitHub Repo */}
            <a
              href="https://github.com/naimNB/shopshield-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              title="GitHub Repository"
            >
              <GithubIcon className="w-5 h-5" />
            </a>

            <a
              href="#analyzer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Promises</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-navy-950 px-4 pt-2 pb-4 space-y-3">
          <a
            href="#analyzer"
            onClick={() => setIsMenuOpen(false)}
            className="block text-emerald-400 font-semibold py-1"
          >
            AI Analyzer
          </a>
          <a
            href="#problem-solution"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-300 hover:text-emerald-400 py-1"
          >
            Why ShopShield
          </a>
          <a
            href="#features"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-300 hover:text-emerald-400 py-1"
          >
            Features
          </a>
          <a
            href="#preview"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-300 hover:text-emerald-400 py-1"
          >
            Preview
          </a>
          <a
            href="#architecture"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-300 hover:text-emerald-400 py-1"
          >
            Architecture
          </a>
          <a
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-slate-300 hover:text-emerald-400 py-1"
          >
            API Docs (FastAPI)
          </a>
        </div>
      )}
    </nav>
  );
};
