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
      desc: 'আপনার আপলোড করা স্ক্রিনশট বা চ্যাট সার্ভারে স্থায়ীভাবে জমা রাখা হয় না। মেমোরিতে প্রসেসিং শেষ হওয়ার সাথে সাথে মুছে ফেলা হয়।',
      icon: Lock,
    },
    {
      title: t('aboutPill1'),
      desc: 'অনলাইন ও সোশ্যাল কমার্সে সাধারণ ক্রেতাদের আর্থিক নিরাপত্তা ও অধিকার রক্ষার একটি উন্মুক্ত প্রযুক্তি উদ্যোগ।',
      icon: Scale,
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-24 border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            {t('aboutHeading')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            {t('aboutSubheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/40 border border-slate-800/70 p-6 sm:p-7 space-y-3"
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
