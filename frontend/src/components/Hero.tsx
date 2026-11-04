import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BuildathonBanner } from './BuildathonBanner';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-[#070c18] pt-8 sm:pt-12 pb-12 sm:pb-16 text-center">
      {/* Unified outer layout container (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Event artwork framed in deep purple panel */}
        <div className="mb-8 sm:mb-10">
          <BuildathonBanner />
        </div>

        {/* Hero typography & CTA centered within the grid */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white font-sans leading-tight">
            {t('heroTitle1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-[#e68b85]">
              {t('heroTitleHighlight')}
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>

          <div className="mt-7 sm:mt-8 flex justify-center">
            <a
              href="#analyzer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-teal-900/30 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[48px]"
            >
              <span>{t('heroCtaVerify')}</span>
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-3.5 text-xs text-slate-400 max-w-xl mx-auto font-sans">
            {t('heroDisclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
