import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Menu, X, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070c18]/95 border-b border-slate-800/80 transition-colors">
      <a
        href="#analyzer"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 font-sans text-xs font-semibold"
      >
        {t('skipToMain')}
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand (Inspired by OpenDatasets clean prominence) */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-0.5"
              aria-label={`${t('appTitle')} Home`}
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/25 transition-all shadow-xs">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-sans">
                    ShopShield
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono">
                    BD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-none -mt-0.5 hidden sm:block">
                  {t('appSubtitle')}
                </p>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1.5"
          >
            <a
              href="#analyzer"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              {t('navVerify')}
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              {t('navHowItWorks')}
            </a>
            <a
              href="#about"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              {t('navAbout')}
            </a>
          </nav>

          {/* Action & Status & Language Switch (Unified height h-9, consistent gap-2.5) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Language Switcher Segmented Control */}
            <div
              className="h-9 inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-medium shadow-xs"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`h-full px-2.5 rounded-md text-xs font-semibold transition-all ${
                  language === 'bn'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'bn'}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-full px-2.5 rounded-md text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'en'}
              >
                English
              </button>
            </div>

            {/* Backend Health Badge (Visible on xl screens to maintain clean spacing) */}
            <div
              role="status"
              aria-label={`Server: ${
                backendStatus === 'healthy'
                  ? t('serverOnline')
                  : backendStatus === 'checking'
                  ? t('serverConnecting')
                  : t('serverOffline')
              }`}
              className="h-9 hidden xl:inline-flex items-center gap-2 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-sans"
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
              <span className="text-xs font-medium">
                {backendStatus === 'healthy'
                  ? t('serverOnline')
                  : backendStatus === 'checking'
                  ? t('serverConnecting')
                  : t('serverOffline')}
              </span>
            </div>

            {/* GitHub Repo Button (OpenDatasets structure) */}
            <a
              href="https://github.com/naimNB/shopshield-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
              title={t('githubRepo')}
              aria-label={t('githubRepo')}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </a>

            {/* Primary Action Button */}
            <a
              href="#analyzer"
              className="h-9 inline-flex items-center justify-center px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <span>{t('heroCtaVerify')}</span>
            </a>
          </div>

          {/* Mobile/Tablet menu button (visible below lg) */}
          <div className="lg:hidden flex items-center gap-2">
            <div
              className="h-9 sm:hidden inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-medium"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`h-full px-2 rounded-md text-xs font-semibold transition-all ${
                  language === 'bn' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400'
                }`}
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-full px-2 rounded-md text-xs font-semibold transition-all ${
                  language === 'en' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400'
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

      {/* Mobile / Tablet Drawer Menu (visible below lg when open) */}
      {isMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="lg:hidden border-b border-slate-800 bg-[#070c18] px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
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

          <div className="pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between px-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white px-2 py-1 rounded-md bg-slate-800/60"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
