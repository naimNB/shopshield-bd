import React from 'react';
import { ShieldCheck, Lock, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  const principles = [
    {
      title: t('aboutPill2'),
      desc: t('aboutParagraph2'),
      icon: ShieldCheck,
    },
    {
      title: t('aboutPill3'),
      desc: t('aboutPrivacyDesc'),
      icon: Lock,
    },
    {
      title: t('aboutPill1'),
      desc: t('aboutOpenSourceDesc'),
      icon: Scale,
    },
  ];

  return (
    <section id="about" className="py-12 sm:py-16 border-t border-[#253047]/75 bg-[#0a1020]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            {t('aboutHeading')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            {t('aboutSubheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#111b2e] border border-[#29364f] p-5 sm:p-6 space-y-3 h-full flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-sans">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
