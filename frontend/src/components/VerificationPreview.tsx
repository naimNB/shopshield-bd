import React, { useState } from 'react';
import { FileText, ShieldAlert, CheckCircle2, Lock, ArrowRight, Sparkles, MessageSquare, History } from 'lucide-react';

export const VerificationPreview: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      title: "ধাপ ১: বিজ্ঞাপনের প্রাথমিক পরীক্ষা",
      subtitle: "বিজ্ঞাপনের অফার ও শর্তাবলি স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট করুন",
      icon: <FileText className="w-5 h-5 text-teal-400" />,
      tag: "Ad-only Check",
      sampleInput: "স্মার্ট ওয়াচ অফার মাত্র ১২০০ টাকা। সারা বাংলাদেশে ফ্রি হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি প্রযোজ্য।",
      findings: [
        { label: "বিজ্ঞাপিত মূল্য", val: "৳ ১,২০০", status: "STATED_CLAIM", color: "text-emerald-400" },
        { label: "ক্যাশ অন ডেলিভারি", val: "উপলব্ধ (Available)", status: "STATED_CLAIM", color: "text-emerald-400" },
        { label: "অনুল্লেখিত শর্ত", val: "ওয়ারেন্টির মেয়াদ নির্দিষ্ট নয়", status: "MISSING_INFORMATION", color: "text-amber-400" },
      ],
      buyerTip: "বিজ্ঞাপনে ফ্রি ডেলিভারি লিখলেও বিক্রেতারা চ্যাটে প্রায়ই অগ্রিম ডেলিভারি ফি দাবি করেন।",
    },
    {
      id: 1,
      title: "ধাপ ২: ইনবক্স চ্যাটে গরমিল শনাক্তকরণ",
      subtitle: "পাবলিক বিজ্ঞাপনের সাথে প্রাইভেট মেসেজের অমিল চিহ্নিত করুন",
      icon: <MessageSquare className="w-5 h-5 text-rose-400" />,
      tag: "Contradiction Detection",
      sampleInput: "চ্যাটে বিক্রেতা: 'ভাইয়া অফার শেষ, এখন ১৫০০ টাকা। আর ডেলিভারি পেতে হলে সম্পূর্ণ টাকা আগে বিকাশ করতে হবে।'",
      findings: [
        { label: "মূল্য গরমিল", val: "বিজ্ঞাপনে ১২০০ ৳ বনাম চ্যাটে ১৫০০ ৳", status: "CONTRADICTION", color: "text-rose-400" },
        { label: "পেমেন্ট শর্ত পরিবর্তন", val: "সিওডি বাতিল করে ১০০% অগ্রিম দাবি", status: "CONTRADICTION", color: "text-rose-400" },
        { label: "ঝুঁকি লেভেল", val: "উচ্চ ঝুঁকি (ব্যক্তিগত ওয়ালেটে সম্পূর্ণ অগ্রিম)", status: "HIGH_RISK", color: "text-rose-400" },
      ],
      buyerTip: "ব্যক্তিগত নম্বরে সম্পূর্ণ মূল্য কখনোই অগ্রিম পরিশোধ করবেন না। অর্ডার বাতিল করা নিরাপদ।",
    },
    {
      id: 2,
      title: "ধাপ ৩: পেজ ট্রান্সপারেন্সি ও আর্কাইভ হিস্ট্রি",
      subtitle: "পেজ তৈরির তারিখ, নাম পরিবর্তন ও ডোমেইন বয়স পরীক্ষা",
      icon: <History className="w-5 h-5 text-blue-400" />,
      tag: "Seller Intelligence",
      sampleInput: "ফেসবুক পেজ ট্রান্সপারেন্সি স্ক্রিনশট ও ডোমেইন লিঙ্ক: daraz.com.bd",
      findings: [
        { label: "পেজ বয়স", val: "২০২৬ সালে তৈরি (মাত্র ৩ দিন পূর্বে)", status: "NEEDS_REVIEW", color: "text-amber-400" },
        { label: "নাম পরিবর্তন", val: "গত ৬ মাসে ৩ বার নাম পরিবর্তিত", status: "NEEDS_REVIEW", color: "text-amber-400" },
        { label: "আর্কাইভ উপস্থিতি", val: "Wayback Machine এ সংরক্ষিত রেকর্ড নেই", status: "INFO", color: "text-slate-400" },
      ],
      buyerTip: "নতুন খোলা বা বারবার নাম পরিবর্তন করা পেজ থেকে কেনাকাটায় সতর্কতা অবলম্বন করুন।",
    },
    {
      id: 3,
      title: "ধাপ ৪: প্রস্তুত প্রশ্ন বিক্রেতাকে ইনবক্সে পাঠানো",
      subtitle: "পেমেন্ট করার আগেই লিখিত নিশ্চয়তা গ্রহণ করুন",
      icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
      tag: "Buyer Questions",
      sampleInput: "সিস্টেম স্বয়ংক্রিয়ভাবে বিক্রেতাকে পাঠানোর জন্য তৈরি প্রশ্নমালা সরবরাহ করে:",
      findings: [
        { label: "প্রশ্ন ১", val: "বিজ্ঞাপনে ১২০০ টাকা বলা হয়েছিল, চ্যাটে ১৫০০ কেন হচ্ছে?", status: "QUESTION", color: "text-teal-300" },
        { label: "প্রশ্ন ২", val: "ডেলিভারি চার্জের বেশি কোনো টাকা অগ্রিম দেওয়া যাবে কি না?", status: "QUESTION", color: "text-teal-300" },
        { label: "প্রশ্ন ৩", val: "পণ্য হাতে পেয়ে চেক করে নেওয়ার সুযোগ থাকবে কি?", status: "QUESTION", color: "text-teal-300" },
      ],
      buyerTip: "প্রশ্নগুলোর উত্তর ইনবক্সে লিখে রাখলে পরবর্তীতে ভোক্তা অধিকার অধিদপ্তরে অভিযোগ দাখিল সহজ হয়।",
    },
  ];

  return (
    <section id="preview" className="py-16 sm:py-20 border-t border-slate-800/80 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>লাইভ সিস্টেম ওয়াকথ্রু</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
            কীভাবে কাজ করে শপশিল্ড বিডি?
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            কোনো জটিলতা ছাড়া মাত্র ৪টি সহজ ধাপে অনলাইন শপিংয়ের নিরাপত্তা ও সত্যতা যাচাই করুন।
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto mb-8">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeStep === idx
                  ? 'bg-slate-900 border-teal-500 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">ধাপ 0{idx + 1}</span>
                {s.icon}
              </div>
              <span className={`text-xs font-semibold block ${activeStep === idx ? 'text-white' : 'text-slate-300'}`}>
                {s.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Active Step Interactive Card */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Card Header Bar */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2">shopshield://workflow/step-0{activeStep + 1}</span>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-900/60">
              {steps[activeStep].tag}
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-sans flex items-center gap-2">
                {steps[activeStep].icon}
                <span>{steps[activeStep].title}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {steps[activeStep].subtitle}
              </p>
            </div>

            {/* Input simulation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ইনপুট টেক্সট / প্রমাণ:</span>
              <p className="text-xs sm:text-sm text-slate-200 font-sans italic leading-relaxed">
                &ldquo;{steps[activeStep].sampleInput}&rdquo;
              </p>
            </div>

            {/* Simulated Findings */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block font-sans">সিস্টেম সনাক্তকরণ ফলাফল:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {steps[activeStep].findings.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block">{f.label}</span>
                    <span className={`font-semibold block ${f.color}`}>{f.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Advice Banner */}
            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-teal-300 block">ক্রেতার জন্য করণীয় পরামর্শ:</span>
                <p className="text-slate-300 leading-relaxed">{steps[activeStep].buyerTip}</p>
              </div>
            </div>

            {/* Action to Jump to Tool */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>ব্যক্তিগত গোপনীয়তা ১০০% সুরক্ষিত • কোনো লগিং নেই</span>
              </div>
              <a
                href="#analyzer"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <span>নিজে যাচাই করে দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
