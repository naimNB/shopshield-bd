import React from 'react';
import { ShieldCheck, ExternalLink, Heart } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800 bg-[#050913] py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-white font-sans">ShopShield BD</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                AIgnite 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed font-sans">
              {t('footerTagline')}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Developed by <strong className="text-slate-200">Md. Naim</strong> for YUNet AIgnite Buildathon 2026.
            </p>
          </div>

          {/* Endpoints & Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-sans">
              {t('footerDeveloperApi')}
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href={`${API_BASE_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 flex items-center space-x-1 transition-colors"
                >
                  <span>FastAPI Swagger (/docs)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 flex items-center space-x-1 transition-colors"
                >
                  <span>Health Check (/health)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/redoc`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 flex items-center space-x-1 transition-colors"
                >
                  <span>ReDoc Spec (/redoc)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Hackathon Context */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-sans">
              {t('footerHackathonInfo')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Event:</span>{' '}
                <span className="text-slate-200">YUNet AIgnite Buildathon 2026</span>
              </li>
              <li>
                <span className="text-slate-400">Track:</span>{' '}
                <span className="text-slate-200">Consumer Protection & AI Safety</span>
              </li>
              <li className="pt-1">
                <a
                  href="https://github.com/naimNB/shopshield-bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 flex items-center space-x-1 text-slate-300 transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 ShopShield BD. Open source under MIT License.</p>
          <div className="flex items-center space-x-1 text-slate-300">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Bangladesh Digital Commerce Safety</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
