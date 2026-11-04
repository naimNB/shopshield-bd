import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BuildathonBanner } from './BuildathonBanner';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-[#070c18] pt-6 sm:pt-9 pb-9 sm:pb-12 text-center">
      {/* Full-width event artwork: up to 1600 × 300 on large screens. */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-7 sm:mb-9">
        <BuildathonBanner />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="max-w-4xl mx-auto text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white font-sans leading-tight">
          {t('heroTitle1')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-[#e68b85]">
            {t('heroTitleHighlight')}
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
          {t('heroSubtitle')}
        </p>

        <div className="mt-6 sm:mt-7 flex justify-center">
          <a
            href="#analyzer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-teal-900/30 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[48px]"
          >
            <span>{t('heroCtaVerify')}</span>
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-3 text-xs text-slate-400 max-w-xl mx-auto">
          {t('heroDisclaimer')}
        </p>
      </div>
    </section>
  );
};
