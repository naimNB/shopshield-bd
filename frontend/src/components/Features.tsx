import React from 'react';
import { Camera, CreditCard, ShieldCheck, Clock, FileText, Scale } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Camera className="w-6 h-6 text-teal-400" />,
      title: "মাল্টিমোডাল এআই ও স্ক্রিনশট অডিট",
      titleEn: "Multimodal Gemini OCR",
      description:
        "বিজ্ঞাপন বা মেসেঞ্জারের স্ক্রিনশট আপলোড করলেই সরাসরি টেক্সট এক্সট্রাক্ট করে পণ্যের মূল্য, ওয়ারেন্টি এবং রিটার্ন পলিসি বিশ্লেষণ করে। কোনো ছবি সার্ভারে স্থায়ীভাবে জমা রাখা হয় না।",
      badge: "Gemini OCR",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      title: "বিকাশ ও নগদ পেমেন্ট ঝুঁকি বিশ্লেষণ",
      titleEn: "Payment Safety Radar",
      description:
        "পার্সোনাল নম্বরে পূর্ণ অগ্রিম চাওয়ার ঝুঁকি নির্দেশ করে এবং ডেলিভারি চার্জের বাইরে বাড়তি টাকা পরিশোধ না করার জন্য সুস্পষ্ট নিরাপত্তা পরামর্শ দেয়।",
      badge: "পেমেন্ট সুরক্ষা",
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      title: "বিজ্ঞাপন বনাম চ্যাট গরমিল শনাক্ত",
      titleEn: "Promise Cross-Reference",
      description:
        "পাবলিক বিজ্ঞাপনের বিজ্ঞাপিত অফারের সাথে ইনবক্সে বিক্রেতার কথার কোনো অমিল (যেমন: মূল্য বৃদ্ধি, সিওডি বাতিল, ওয়ারেন্টি অস্বীকার) আছে কি না তা নিখুঁতভাবে চিহ্নিত করে।",
      badge: "গরমিল বিশ্লেষণ",
    },
    {
      icon: <Clock className="w-6 h-6 text-indigo-400" />,
      title: "ইন্টারনেট আর্কাইভ ও ডোমেইন হিস্ট্রি",
      titleEn: "Wayback Machine CDX",
      description:
        "অনলাইন শপের ওয়েবসাইটের পূর্বের সংরক্ষিত স্ন্যাপশট খুঁজে বের করে এবং অতীতে তাদের নীতিমালায় কোনো পরিবর্তন এসেছে কি না তা যাচাই করে।",
      badge: "Wayback CDX",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      title: "ফেসবুক পেজ ট্রান্সপারেন্সি অডিট",
      titleEn: "Page Transparency Audit",
      description:
        "ফেসবুক পেজ তৈরির তারিখ, পূর্বের নাম পরিবর্তনের ইতিহাস এবং অ্যাডমিন লোকেশন বিশ্লেষণ করে পেজের বিশ্বাসযোগ্যতার বাস্তব প্রমাণ তুলে ধরে।",
      badge: "ট্রান্সপারেন্সি",
    },
    {
      icon: <Scale className="w-6 h-6 text-teal-400" />,
      title: "প্রস্তুত প্রশ্নমালা ও ভোক্তা অধিকার",
      titleEn: "Buyer Verification Questions",
      description:
        "প্রতিটি অডিটের পর বিক্রেতাকে ইনবক্সে পাঠানোর মতো স্পষ্ট বাংলায় যাচাইকারী প্রশ্নমালা তৈরি করে, যা ক্রেতাকে লিখিত প্রমাণ রাখতে সাহায্য করে।",
      badge: "ভোক্তা অধিকার",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>বাংলাদেশি ক্রেতাদের জন্য বিশেষায়িত ফিচারসমূহ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
            নিরাপদ অনলাইন কেনাকাটার পূর্ণাঙ্গ সুরক্ষা
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            শপশিল্ড বিডি কোনো অনুমিত ট্রাস্ট স্কোর তৈরি করে না; বরং বাস্তব তথ্যের ভিত্তিতে ক্রেতাকে সিদ্ধান্ত নিতে সাহায্য করে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200 group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800/80 text-teal-300 border border-slate-700/50">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-teal-300 transition-colors font-sans">
                  {feature.title}
                </h3>
                <span className="text-xs font-mono text-slate-400 block mb-2">{feature.titleEn}</span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {feature.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="text-emerald-400">● লাইভ সক্রিয়</span>
                <a href="#analyzer" className="hover:text-white transition-colors">পরীক্ষা করুন &rarr;</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
