import React from 'react';
import { XCircle, CheckCircle2, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export const ProblemSolution: React.FC = () => {
  return (
    <section id="problem-solution" className="py-16 sm:py-20 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>সোশ্যাল কমার্স ও অনলাইন শপিংয়ের বাস্তবতা</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
            অনলাইনে কেনাকাটায় সাধারণ ক্রেতারা কেন প্রতারিত হন?
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            বাংলাদেশে ফেসবুক ও মেসেঞ্জারে হওয়া কেনাকাটার ৬০% এর বেশি কোনো চুক্তিপত্র ছাড়া কেবল মৌখিক চ্যাটে সম্পন্ন হয়। প্রমাণ বা লিখিত প্রতিশ্রুতির অভাবে ক্রেতারা প্রায়ই আর্থিক ক্ষতির মুখে পড়েন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* The Vulnerability (Without ShopShield) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-rose-950/15 border border-rose-900/40 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-sans">অরক্ষিত ক্রেতার সাধারণ সমস্যা</h3>
                  <p className="text-xs text-rose-400 font-mono">Current F-Commerce Risks</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">ব্যক্তিগত নম্বরে সম্পূর্ণ অগ্রিম চাওয়া:</strong> বিজ্ঞাপনে ক্যাশ অন ডেলিভারি লিখে চ্যাটে পুরো টাকা ব্যক্তিগত বিকাশ বা নগদে পাঠাতে বাধ্য করা হয়।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">কাগুজে ওয়ারেন্টি ও প্রতিশ্রুতি অস্বীকার:</strong> বিজ্ঞাপনে ১ বছরের অফিশিয়াল ওয়ারেন্টি বলা হলেও সমস্যা হলে বিক্রেতা ইনবক্সে ব্লক করে দেয়।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">মূল্য ও রিটার্ন পলিসিতে গরমিল:</strong> বিজ্ঞাপনে ছাড়ের মূল্য দেখিয়ে চ্যাটে ডেলিভারির সময় অতিরিক্ত চার্জ বা রিটার্ন অস্বীকার করা হয়।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">ভুয়া ও অবিশ্বস্ত পেজ হিস্টোরি:</strong> পেজের নাম বারবার পরিবর্তন করে বা নতুন পেজ খুলে পুরনো ক্রেতাদের সাথে যোগাযোগ বিচ্ছিন্ন করা হয়।
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-rose-900/30 text-xs text-rose-300 font-mono flex items-center gap-1.5">
              <span>⚠️ ফলাফল: ক্রেতার আর্থিক ক্ষতি এবং অনলাইন কেনাকাটায় আস্থার সংকট।</span>
            </div>
          </div>

          {/* The Protection (With ShopShield BD) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-teal-950/20 border border-teal-800/40 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-sans">শপশিল্ড বিডির প্রমাণভিত্তিক সুরক্ষা</h3>
                  <p className="text-xs text-teal-400 font-mono">Evidence-Grounded Consumer Shield</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-teal-300">অগ্রিম পেমেন্ট ঝুঁকি বিশ্লেষণ:</strong> সম্পূর্ণ মূল্যের বদলে শুধু ডেলিভারি চার্জ অগ্রিম দেওয়ার নিরাপদ নীতি এবং পার্সোনাল ওয়ালেটের ঝুঁকি নির্দেশ করে।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-teal-300">বিজ্ঞাপন ও চ্যাটের গরমিল শনাক্ত:</strong> বিজ্ঞাপনে দেওয়া শর্তের সাথে বিক্রেতার ইনবক্স চ্যাটের কথার অমিল স্বয়ংক্রিয়ভাবে তুলে ধরে।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-teal-300">স্বাধীন ইন্টারনেট আর্কাইভ যাচাই:</strong> পেজ তৈরি, নাম পরিবর্তন ও Wayback Machine থেকে ডোমেইনের ইতিহাস পরীক্ষা করে।
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-teal-300">যাচাইকারী প্রশ্নমালা:</strong> পেমেন্ট করার আগেই বিক্রেতাকে ইনবক্সে পাঠানোর মতো স্পষ্ট বাংলায় প্রশ্ন তৈরি করে দেয়।
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-teal-800/40 text-xs text-teal-300 font-mono flex items-center justify-between">
              <span>🛡️ ফলাফল: কোনো অনুমান বা ভুয়া স্কোর ছাড়াই বাস্তব তথ্যের ভিত্তিতে নিরাপত্তা।</span>
              <a href="#analyzer" className="hover:underline flex items-center gap-1 text-teal-400 font-sans">
                <span>যাচাই করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
