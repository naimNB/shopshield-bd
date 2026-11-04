import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BuildathonBanner: React.FC = () => {
  const { language } = useLanguage();

  const isBn = language === 'bn';

  return (
    <aside
      aria-label={
        isBn
          ? 'বিল্ডাথন ২০২৬ অফিশিয়াল স্টিকার'
          : 'Buildathon 2026 Official Project Sticker'
      }
      className="w-full bg-[#050914] border-b border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <a
          href="https://yunet-aignite26.devpost.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-2xl transition-transform hover:scale-[1.01]"
          title="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — Devpost"
          aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — Devpost"
        >
          <picture>
            <source srcSet="/assets/built-for-aignite-2026.webp" type="image/webp" />
            <img
              src="/assets/built-for-aignite-2026.png"
              alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
              width={1912}
              height={679}
              loading="eager"
              decoding="async"
              className="h-14 sm:h-16 md:h-20 w-auto max-w-[90vw] object-contain rounded-2xl shadow-lg border border-white/20 group-hover:border-teal-400/70 group-hover:ring-2 group-hover:ring-teal-400/30 transition-all"
            />
          </picture>
        </a>

        <a
          href="https://yunet-aignite26.devpost.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-teal-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-teal-500/50 rounded-lg px-2.5 py-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <span className="font-sans">
            {isBn ? 'অফিশিয়াল ইভেন্ট (Devpost)' : 'Official Devpost Event'}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
};

export default BuildathonBanner;
