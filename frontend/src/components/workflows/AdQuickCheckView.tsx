import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Shield,
  RotateCcw,
  Info,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import type { AdAnalysisResponse } from '../../types/api';
import { ScreenshotUploader } from '../shared/ScreenshotUploader';
import { UnifiedFindingCard } from '../shared/UnifiedFindingCard';
import { BuyerQuestionsCard } from '../shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from '../shared/PaymentWarningsCard';
import { LoadingState, ErrorState, EmptyState } from '../shared/StatusState';

const SAMPLE_ADS = [
  {
    title: 'উদাহরণ ১: উইন্টার হুডি (শর্ত অস্পষ্ট)',
    text: `শীতের ধামাকা অফার! প্রিমিয়াম এক্সপোর্ট কোয়ালিটি ফ্লিস হুডি মাত্র ৭৫০ টাকা! সারাদেশে হোম ডেলিভারি ফ্রি। অর্ডার কনফার্ম করতে ডেলিভারি চার্জ ২০০ টাকা অগ্রিম বিকাশ করতে হবে। পণ্য দেখে মূল্য পরিশোধ করুন। স্টক সীমিত!`,
    product: 'প্রিমিয়াম ফ্লিস হুডি',
  },
  {
    title: 'উদাহরণ ২: স্মার্টওয়াচ (উচ্চ ঝুঁকির অগ্রিম পেমেন্ট)',
    text: `আল্ট্রা স্মার্টওয়াচ সিরিজ ৯! অরিজিনাল ডিসপ্লে, ব্লুটুথ কলিং, ওয়াটারপ্রুফ। অফার প্রাইস মাত্র ১২০০ টাকা (মার্কেট প্রাইজ ৩৫০০ টাকা)। অগ্রিম পুরো ১২০০ টাকা আমাদের পার্সোনাল বিকাশ/নগদে পাঠালে সাথে সাথে কুরিয়ার করা হবে। কোনো ক্যাশ অন ডেলিভারি নেই।`,
    product: 'আল্ট্রা স্মার্টওয়াচ সিরিজ ৯',
  },
  {
    title: 'উদাহরণ ৩: চামড়ার লোফার (ফুল ক্যাশ অন ডেলিভারি)',
    text: `১০০% অরিজিনাল লেদার ফরমাল লোফার সু। সাইজ ৩৯-৪৪। মূল্য ২১৫০ টাকা। সারা বাংলাদেশে ফুল ক্যাশ অন ডেলিভারি—কোনো অগ্রিম টাকা দিতে হবে না! ডেলিভারি ম্যানের সামনে চেক করে সাইজ না মিললে সাথে সাথে পরিবর্তন বা ফেরতযোগ্য।`,
    product: 'অরিজিনাল লেদার লোফার সু',
  },
];

export const AdQuickCheckView: React.FC = () => {
  const [adText, setAdText] = useState('');
  const [productContext, setProductContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdAnalysisResponse | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adText.trim() || adText.trim().length < 5) {
      setError('অনুগ্রহ করে বিজ্ঞাপনের টেক্সট লিখুন অথবা স্ক্রিনশট আপলোড করুন (কমপক্ষে ৫ অক্ষর)।');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzeAd({
        advertisement_text: adText.trim(),
        product_context: productContext.trim() || undefined,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'বিজ্ঞাপন বিশ্লেষণ সম্পন্ন করা যায়নি।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAdText('');
    setProductContext('');
    setResult(null);
    setError(null);
  };

  const loadSample = (sample: typeof SAMPLE_ADS[0]) => {
    setAdText(sample.text);
    setProductContext(sample.product);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Intro Banner */}
      <div className="bg-[#0a1224] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-sans">
              বিজ্ঞাপন দ্রুত যাচাই (Advertisement Quick Check)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              বিক্রেতার সাথে ইনবক্সে চ্যাট শুরু করার আগেই বিজ্ঞাপনের লুকানো শর্ত ও অগ্রিম পেমেন্টের ঝুঁকি পরীক্ষা করুন
            </p>
          </div>
        </div>

        {/* Sample Loaders */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium font-sans">বাস্তব নমুনা লোড করুন:</span>
          {SAMPLE_ADS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[36px]"
            >
              {sample.title.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleAnalyze} className="bg-[#0a1224] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Ad Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ad-text-input" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>বিজ্ঞাপনের টেক্সট (Facebook Post / Caption)</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                {adText.length} অক্ষর
              </span>
            </div>
            <textarea
              id="ad-text-input"
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="ফেসবুক পেজের বিজ্ঞাপনের ক্যাপশন বা পোস্টের লেখা এখানে পেস্ট করুন..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
          </div>

          {/* Screenshot Upload with OCR */}
          <div className="space-y-2">
            <ScreenshotUploader
              label="বিজ্ঞাপনের স্ক্রিনশট আপলোড (ঐচ্ছিক OCR)"
              helperText="পোস্ট বা ব্যানারের ছবি দিলে স্বয়ংক্রিয়ভাবে টেক্সট এক্সট্রাক্ট করে ইনপুটে যোগ করবে"
              onExtractedText={(text) => {
                setAdText((prev) => (prev ? `${prev}\n\n[OCR টেক্সট]:\n${text}` : text));
                if (error) setError(null);
              }}
            />
          </div>
        </div>

        {/* Optional Product Context & Action Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
          <div className="flex-grow max-w-md">
            <label htmlFor="product-context-input" className="text-xs text-slate-300 font-medium block mb-1 font-sans">
              পণ্যের নাম বা ক্যাটাগরি <span className="text-slate-400 font-mono text-[11px]">(ঐচ্ছিক)</span>
            </label>
            <input
              id="product-context-input"
              type="text"
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
              placeholder="যেমন: উইন্টার হুডি, স্মার্টওয়াচ ইত্যাদি"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto mt-2 sm:mt-0">
            {adText && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>নতুন যাচাই</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !adText.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>বিজ্ঞাপন বিশ্লেষণ করুন</span>
            </button>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title="বিজ্ঞাপন বিশ্লেষণ চলছে..."
          message="ShopShield AI বিজ্ঞাপনের স্পষ্ট অঙ্গীকার, অসম্পূর্ণ শর্ত এবং পেমেন্ট ঝুঁকি পরীক্ষা করছে..."
          steps={[
            'বিজ্ঞাপন থেকে মূল্য, সিওডি এবং অগ্রিম পেমেন্টের শর্ত নিষ্কাশন করা হচ্ছে...',
            'অনুপস্থিত প্রয়োজনীয় তথ্য (রিটার্ন, ওয়ারেন্টি, ডেলিভারি ফি) চিহ্নিত করা হচ্ছে...',
            'ক্রেতার জন্য করণীয় প্রশ্ন ও পেমেন্ট নিরাপত্তা পরামর্শ প্রস্তুত করা হচ্ছে...',
          ]}
        />
      )}

      {/* Error State with retained user text */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => handleAnalyze()} />
      )}

      {/* Evidence-First Results Section */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Top Banner: Verification Scope Disclaimer */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-slate-200 flex items-start gap-3 shadow-sm">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold text-sky-200 text-sm font-sans">
                বিজ্ঞাপনভিত্তিক প্রাথমিক অনুসন্ধান (Ad-Only Verification Scope)
              </p>
              <p className="leading-relaxed text-slate-300 font-sans">
                {result.limitations}
              </p>
            </div>
          </div>

          {/* Quick Metrics Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0a1224] border border-slate-800 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-xs text-slate-400 block font-sans">মোট পর্যবেক্ষণ</span>
              <span className="text-xl font-extrabold text-slate-100 font-mono">{result.findings.length} টি</span>
            </div>
            <div className="bg-[#0a1224] border border-slate-800 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-xs text-slate-400 block font-sans">সুস্পষ্ট অঙ্গীকার</span>
              <span className="text-xl font-extrabold text-teal-400 font-mono">{result.explicit_terms.length} টি</span>
            </div>
            <div className="bg-[#0a1224] border border-slate-800 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-xs text-slate-400 block font-sans">অনুপস্থিত তথ্য</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">{result.missing_critical_info.length} টি</span>
            </div>
            <div className="bg-[#0a1224] border border-slate-800 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-xs text-slate-400 block font-sans">পেমেন্ট সতর্কতা</span>
              <span className="text-xl font-extrabold text-rose-400 font-mono">{result.payment_considerations.length} টি</span>
            </div>
          </div>

          {/* D. Payment Considerations */}
          {result.payment_considerations.length > 0 && (
            <PaymentWarningsCard warnings={result.payment_considerations} />
          )}

          {/* E. Buyer Action Questions (One-Click Copy) */}
          {result.buyer_questions_bangla.length > 0 && (
            <BuyerQuestionsCard
              questions={result.buyer_questions_bangla}
              title="বিজ্ঞাপন দেখে বিক্রেতাকে ইনবক্সে যা জিজ্ঞাসা করবেন"
              description="বিজ্ঞাপনে যেসব শর্ত পরিষ্কার ছিল না, সেগুলো ইনবক্সে কনফার্ম করতে নিচের প্রশ্নগুলো কপি করে পাঠান:"
            />
          )}

          {/* A. Explicit Terms Stated in Ad */}
          {result.explicit_terms.length > 0 && (
            <div className="bg-[#0a1224] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" aria-hidden="true" />
                <h4 className="font-bold text-slate-100 text-sm sm:text-base font-sans">
                  বিজ্ঞাপনে সুস্পষ্টভাবে উল্লিখিত শর্তাবলি (Explicit Stated Terms)
                </h4>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-200">
                {result.explicit_terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    <span className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" aria-hidden="true" />
                    <span className="leading-relaxed font-sans">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* C. Missing Critical Information */}
          {result.missing_critical_info.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/35 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                <h4 className="font-bold text-amber-200 text-sm sm:text-base font-sans">
                  বিজ্ঞাপনে যেসব গুরুত্বপূর্ণ তথ্য নেই (Omitted Critical Terms)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.missing_critical_info.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-xs font-sans">{item.field_label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                        {item.importance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. Ambiguous Statements */}
          {result.ambiguous_statements && result.ambiguous_statements.length > 0 && (
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400 shrink-0" aria-hidden="true" />
                <h4 className="font-bold text-purple-200 text-sm sm:text-base font-sans">
                  দ্ব্যর্থবোধক বা অস্পষ্ট বিজ্ঞাপনী উক্তি (Ambiguous Statements)
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {result.ambiguous_statements.map((stmt, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <span className="font-sans leading-relaxed">{stmt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Unified Findings List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2 font-sans">
                <Shield className="w-5 h-5 text-teal-400 shrink-0" aria-hidden="true" />
                <span>যাচাইকৃত প্রমাণের তালিকা (Unified Findings)</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {result.findings.length} টি পর্যবেক্ষণ
              </span>
            </div>

            <div className="space-y-3">
              {result.findings.map((finding) => (
                <UnifiedFindingCard key={finding.finding_id} finding={finding} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <EmptyState
          title="বিজ্ঞাপনের সত্যতা যাচাই করুন"
          description="ফেসবুক পেজ, ইনস্টাগ্রাম বা ওয়েবসাইটের বিজ্ঞাপনের ক্যাপশন পেস্ট করুন বা পোস্টের স্ক্রিনশট আপলোড করে প্রাথমিক ফাঁকফোকর ও শর্ত পরীক্ষা করুন।"
        />
      )}
    </div>
  );
};
