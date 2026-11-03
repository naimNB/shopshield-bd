import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (isMounted) {
          setBackendStatus(res.ok ? 'healthy' : 'offline');
        }
      } catch {
        if (isMounted) {
          setBackendStatus('offline');
        }
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close menu on Escape key press and restore focus to menu button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070c18]/90 border-b border-slate-800/80 transition-colors">
      <a
        href="#analyzer"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {t('skipToMain')}
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <a
            href="#"
            className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1"
            aria-label={`${t('appTitle')} Home`}
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-all shadow-sm">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">
                  ShopShield
                </span>
                <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  BD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans -mt-0.5">{t('appSubtitle')}</p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Navigation Menu"
            className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300"
          >
            <a
              href="#analyzer"
              className="hover:text-teal-400 transition-colors py-1 focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
            >
              {t('navVerify')}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-teal-400 transition-colors py-1 focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
            >
              {t('navHowItWorks')}
            </a>
            <a
              href="#about"
              className="hover:text-teal-400 transition-colors py-1 focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
            >
              {t('navAbout')}
            </a>
          </nav>

          {/* Action & Status & Language Switch */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Language Switcher Segment Toggle */}
            <div
              className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 text-xs font-medium shadow-inner"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === 'bn'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'bn'}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'en'}
              >
                English
              </button>
            </div>

            {/* Backend Health Badge */}
            <div
              role="status"
              aria-label={`Server: ${
                backendStatus === 'healthy'
                  ? t('serverOnline')
                  : backendStatus === 'checking'
                  ? t('serverConnecting')
                  : t('serverOffline')
              }`}
              className="flex items-center space-x-1.5 text-xs text-slate-400"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-teal-400'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
                aria-hidden="true"
              />
              <span className="text-[11px] font-sans">
                {backendStatus === 'healthy'
                  ? t('serverOnline')
                  : backendStatus === 'checking'
                  ? t('serverConnecting')
                  : t('serverOffline')}
              </span>
            </div>

            {/* GitHub Repo */}
            <a
              href="https://github.com/naimNB/shopshield-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg"
              title={t('githubRepo')}
              aria-label={t('githubRepo')}
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            {/* Primary Action Button */}
            <a
              href="#analyzer"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <span>{t('heroCtaVerify')}</span>
            </a>
          </div>

          {/* Mobile menu button and language switch */}
          <div className="md:hidden flex items-center space-x-2">
            <div
              className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-medium"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  language === 'bn' ? 'bg-teal-500 text-white' : 'text-slate-400'
                }`}
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  language === 'en' ? 'bg-teal-500 text-white' : 'text-slate-400'
                }`}
              >
                EN
              </button>
            </div>

            <button
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-b border-slate-800 bg-[#070c18] px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <a
            href="#analyzer"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/80 hover:text-teal-400 text-sm font-medium transition-colors"
          >
            {t('navVerify')}
          </a>
          <a
            href="#how-it-works"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/80 hover:text-teal-400 text-sm font-medium transition-colors"
          >
            {t('navHowItWorks')}
          </a>
          <a
            href="#about"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/80 hover:text-teal-400 text-sm font-medium transition-colors"
          >
            {t('navAbout')}
          </a>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-3 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'healthy' ? 'bg-teal-400' : 'bg-rose-500'
                }`}
                aria-hidden="true"
              />
              <span>Server: {backendStatus === 'healthy' ? t('serverOnline') : t('serverOffline')}</span>
            </div>
            <a
              href="https://github.com/naimNB/shopshield-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
