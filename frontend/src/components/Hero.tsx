import React from 'react';
import { ArrowDown } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 text-center max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
        কেনার আগে যাচাই করুন
      </h1>

      <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
        অনলাইন বিজ্ঞাপন, বিক্রেতার কথাবার্তা এবং উপলব্ধ ঐতিহাসিক তথ্য মিলিয়ে কেনাকাটার সিদ্ধান্ত নিন।
      </p>

      <div className="mt-8 flex justify-center">
        <a
          href="#analyzer"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-teal-900/30 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[48px]"
        >
          <span>যাচাই শুরু করুন</span>
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
};
