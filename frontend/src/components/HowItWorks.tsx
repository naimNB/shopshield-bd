import React from 'react';
import { FileText, Cpu, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: '১',
      title: t('step1Title'),
      desc: t('step1Desc'),
      icon: FileText,
    },
    {
      num: '২',
      title: t('step2Title'),
      desc: t('step2Desc'),
      icon: Cpu,
    },
    {
      num: '৩',
      title: t('step3Title'),
      desc: t('step3Desc'),
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 border-t border-[#253047]/75 bg-[#070c18]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            {t('howItWorksHeading')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            {t('howItWorksSubheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-2xl bg-[#111b2e] border border-[#29364f] p-5 sm:p-6 space-y-4 text-center sm:text-left flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto sm:mx-0 font-bold font-mono text-sm">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center justify-center sm:justify-start gap-2">
                    <Icon className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>{step.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
