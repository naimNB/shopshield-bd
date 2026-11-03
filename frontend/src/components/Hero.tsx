import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  FileSearch,
  MessageSquare,
  History,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-slate-800/80 bg-gradient-to-b from-[#070c18] via-[#091021] to-[#070c18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-5">
          {/* Platform Identity Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>প্রমাণভিত্তিক ভোক্তা সুরক্ষা সহকারী • Bangladesh E-Commerce & F-Commerce Safety</span>
          </div>

          {/* Core Bangla Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
            কেনার আগে যাচাই করুন
          </h1>

          {/* Core Bangla Supporting Message */}
          <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-sans max-w-3xl mx-auto">
            অনলাইন বিজ্ঞাপন, বিক্রেতার কথাবার্তা এবং উপলব্ধ ঐতিহাসিক তথ্য মিলিয়ে কেনাকাটার সিদ্ধান্ত নিন।
          </p>

          {/* 5-Question Answers in an Accordion/Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left pt-3">
            {/* 1. What is ShopShield & Problem */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-teal-300">
                <FileSearch className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>ShopShield কী ও কেন প্রয়োজন?</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                ফেসবুক পেজ বা বিজ্ঞাপনের আকর্ষণীয় কথা এবং ইনবক্স চ্যাটের বাস্তব শর্তের গরমিল ধরে অগ্রিম পেমেন্ট জালিয়াতি রোধ করে।
              </p>
            </div>

            {/* 2. What Evidence is Verified */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>কী কী তথ্য যাচাই করা যায়?</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                বিজ্ঞাপনের শর্ত, ইনবক্স চ্যাটের প্রতিশ্রুতি, ফেসবুক পেজের নাম পরিবর্তনের ইতিহাস এবং ওয়েবসাইট আর্কাইভ রেকর্ড।
              </p>
            </div>

            {/* 3. Methodological Limitations */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-1.5 font-semibold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>আমাদের কাজের সীমাবদ্ধতা</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                আমরা কোনো কাল্পনিক প্রতারণা স্কোর বা মিথ্যা গ্যারান্টি দিই না। শুধুমাত্র যাচাইযোগ্য বাস্তব প্রমাণের ভিত্তিতে পর্যালোচনা করি।
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <a
              href="#analyzer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[46px]"
            >
              <span>যাচাইকরণ প্যানেলে যান</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-700/80 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[46px]"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>৪টি যাচাই পদ্ধতি সম্পর্কে জানুন</span>
            </a>
          </div>

          {/* Quick-Access Pills to the 4 Verification Workflows */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">সরাসরি শুরু করুন:</span>
            <a
              href="#ad-check"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 text-xs font-medium transition-colors"
            >
              <FileSearch className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>১. বিজ্ঞাপন যাচাই</span>
            </a>
            <a
              href="#analyzer"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>২. প্রতিশ্রুতি বনাম চ্যাট</span>
            </a>
            <a
              href="#seller-history"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 text-xs font-medium transition-colors"
            >
              <History className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>৩. সেলার ব্যাকগ্রাউন্ড</span>
            </a>
            <a
              href="#compare"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 text-xs font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>৪. নীতিমালা পরিবর্তন</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
