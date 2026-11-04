import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BuildathonBanner } from './BuildathonBanner';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="pt-5 sm:pt-7 pb-10 sm:pb-14 text-center">
      {/* Full-width event artwork: up to 1600 × 300 on large screens. */}
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 mb-8 sm:mb-10">
        <BuildathonBanner />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
          {t('heroTitle1')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            {t('heroTitleHighlight')}
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
          {t('heroSubtitle')}
        </p>

        <div className="mt-7 flex justify-center">
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
