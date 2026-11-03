import React from 'react';
import { FileText, Cpu, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '১',
      title: 'তথ্য দিন',
      desc: 'বিজ্ঞাপনের লেখা পেস্ট করুন অথবা ফেসবুক পোস্ট/চ্যাটের স্ক্রিনশট আপলোড করুন।',
      icon: FileText,
    },
    {
      num: '২',
      title: 'স্বয়ংক্রিয় বিশ্লেষণ',
      desc: 'শপশিল্ড এআই বিজ্ঞাপিত শর্তের সাথে চ্যাটের অমিল ও অগ্রিম পেমেন্টের ঝুঁকি পরীক্ষা করবে।',
      icon: Cpu,
    },
    {
      num: '৩',
      title: 'নিরাপদ সিদ্ধান্ত নিন',
      desc: 'প্রস্তুত প্রশ্নগুলো বিক্রেতাকে পাঠিয়ে লিখিত প্রতিশ্রুতি নিশ্চিত করুন এবং নিরাপদে অর্ডার করুন।',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            কীভাবে কাজ করে?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            মাত্র ৩টি সহজ ধাপে পণ্য কেনার আগেই সব শর্ত ও ঝুঁকি যাচাই করে নিন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 sm:p-7 space-y-4 text-center sm:text-left flex flex-col justify-between"
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
