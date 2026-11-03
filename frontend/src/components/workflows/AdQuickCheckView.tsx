import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import type { AdAnalysisResponse } from '../../types/api';
import { ScreenshotUploader } from '../shared/ScreenshotUploader';
import { BuyerQuestionsCard } from '../shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from '../shared/PaymentWarningsCard';
import { LoadingState, ErrorState, EmptyState } from '../shared/StatusState';

const SAMPLE_ADS = [
  {
    title: 'উদাহরণ ১: হুডি',
    text: `শীতের ধামাকা অফার! প্রিমিয়াম এক্সপোর্ট কোয়ালিটি ফ্লিস হুডি মাত্র ৭৫০ টাকা! সারাদেশে হোম ডেলিভারি ফ্রি। অর্ডার কনফার্ম করতে ডেলিভারি চার্জ ২০০ টাকা অগ্রিম বিকাশ করতে হবে। পণ্য দেখে মূল্য পরিশোধ করুন। স্টক সীমিত!`,
    product: 'প্রিমিয়াম ফ্লিস হুডি',
  },
  {
    title: 'উদাহরণ ২: স্মার্টওয়াচ',
    text: `আল্ট্রা স্মার্টওয়াচ সিরিজ ৯! অরিজিনাল ডিসপ্লে, ব্লুটুথ কলিং, ওয়াটারপ্রুফ। অফার প্রাইস মাত্র ১২০০ টাকা (মার্কেট প্রাইজ ৩৫০০ টাকা)। অগ্রিম পুরো ১২০০ টাকা আমাদের পার্সোনাল বিকাশ/নগদে পাঠালে সাথে সাথে কুরিয়ার করা হবে। কোনো ক্যাশ অন ডেলিভারি নেই।`,
    product: 'আল্ট্রা স্মার্টওয়াচ সিরিজ ৯',
  },
  {
    title: 'উদাহরণ ৩: লোফার সু',
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adText.trim() || adText.trim().length < 5) {
      setError('অনুগ্রহ করে বিজ্ঞাপনের টেক্সট লিখুন অথবা স্ক্রিনশট আপলোড করুন (কমপক্ষে ৫ অক্ষর)।');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzeAd(
        {
          advertisement_text: adText.trim(),
          product_context: productContext.trim() || undefined,
        },
        { signal: controller.signal }
      );
      if (currentId === requestIdRef.current) {
        setResult(data);
      }
    } catch (err: unknown) {
      if (currentId === requestIdRef.current) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
          return;
        }
        const msg = err instanceof Error ? err.message : 'বিজ্ঞাপন বিশ্লেষণ সম্পন্ন করা যায়নি।';
        setError(msg);
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText('');
    setProductContext('');
    setResult(null);
    setError(null);
  };

  const loadSample = (sample: typeof SAMPLE_ADS[0]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText(sample.text);
    setProductContext(sample.product);
    setResult(null);
    setError(null);
  };

  const claims = result?.advertisement_claims;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Form Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
        <div>
          <h3 className="text-xl font-bold text-white font-sans">বিজ্ঞাপন যাচাই</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
            ফেসবুক বা অনলাইনের বিজ্ঞাপনের লেখা পেস্ট করুন অথবা স্ক্রিনশট আপলোড করে শর্ত ও পেমেন্ট ঝুঁকি পরীক্ষা করুন।
          </p>
        </div>

        {/* Sample Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-sans">নমুনা দেখুন:</span>
          {SAMPLE_ADS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[32px]"
            >
              {sample.title}
            </button>
          ))}
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ad-text-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>বিজ্ঞাপনের বিবরণ (ক্যাপশন বা টেক্সট)</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{adText.length} অক্ষর</span>
            </div>
            <textarea
              id="ad-text-input"
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="ফেসবুক পেজের বিজ্ঞাপনের ক্যাপশন বা পোস্টের লেখা এখানে পেস্ট করুন..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
          </div>

          <ScreenshotUploader
            label="স্ক্রিনশট আপলোড (ঐচ্ছিক)"
            helperText="বিজ্ঞাপনের স্ক্রিনশট আপলোড করলে স্বয়ংক্রিয়ভাবে টেক্সট এক্সট্রাক্ট করা হবে।"
            sourceType="advertisement"
            existingText={adText}
            onConfirmText={(text, mode) => {
              setAdText(mode === 'append' ? (adText.trim() ? `${adText.trim()}\n\n${text.trim()}` : text.trim()) : text.trim());
              if (error) setError(null);
            }}
          />

          <div className="flex items-center justify-between pt-2">
            {result ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>নতুন যাচাই</span>
              </button>
            ) : <span />}

            <button
              type="submit"
              disabled={loading || !adText.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>বিজ্ঞাপন বিশ্লেষণ করুন</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title="বিজ্ঞাপন বিশ্লেষণ চলছে..."
          message="বিজ্ঞাপনের স্পষ্ট অঙ্গীকার, অসম্পূর্ণ শর্ত এবং পেমেন্ট ঝুঁকি পরীক্ষা করা হচ্ছে..."
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => handleAnalyze()} />
      )}

      {/* Results Experience (Progressive Disclosure) */}
      {result && !loading && (
        <div className="space-y-6">
          {/* 1. সংক্ষেপে যা পাওয়া গেছে */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 space-y-4">
            <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" aria-hidden="true" />
              <span>সংক্ষেপে যা পাওয়া গেছে</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">পণ্য</span>
                <span className="font-semibold text-slate-100">{claims?.product_name || 'নির্দিষ্ট নয়'}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">বিজ্ঞাপিত মূল্য</span>
                <span className="font-semibold text-teal-300">
                  {claims?.price ? `৳ ${claims.price.toLocaleString('bn-BD')}` : 'অনুল্লেখিত'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">ক্যাশ অন ডেলিভারি (সিওডি)</span>
                <span className="font-semibold text-slate-100">
                  {claims?.cod_available === true
                    ? 'উপলব্ধ (Available)'
                    : claims?.cod_available === false
                    ? 'অনুপলব্ধ (Not Available)'
                    : 'বিজ্ঞাপনে উল্লেখ নেই'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">ডেলিভারি ও অগ্রিম শর্ত</span>
                <span className="font-semibold text-slate-100">
                  {claims?.advance_payment_required
                    ? `অগ্রিম প্রয়োজন: ৳ ${claims.advance_payment_amount || 'অনির্দিষ্ট'}`
                    : claims?.delivery_conditions || 'শর্ত উল্লেখ নেই'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. গরমিল বা সতর্কতা */}
          {result.payment_considerations.length > 0 && (
            <PaymentWarningsCard warnings={result.payment_considerations} />
          )}

          {/* 3. যে তথ্যগুলো নিশ্চিত নয় */}
          {result.missing_critical_info.length > 0 && (
            <div className="rounded-2xl bg-amber-950/15 border border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>যে তথ্যগুলো বিজ্ঞাপনে নিশ্চিত নয় বা অনুপস্থিত</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 font-sans">
                {result.missing_critical_info.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      <strong className="text-slate-100 font-semibold">{item.field_label}:</strong>{' '}
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. কেনার আগে যা জিজ্ঞেস করবেন */}
          {result.buyer_questions_bangla.length > 0 && (
            <BuyerQuestionsCard
              questions={result.buyer_questions_bangla}
              title="কেনার আগে বিক্রেতাকে যা জিজ্ঞেস করবেন"
              description="বিজ্ঞাপনে যেসব তথ্য অস্পষ্ট, সেগুলো অর্ডার করার আগে ইনবক্সে কপি করে পাঠিয়ে নিশ্চিত করুন:"
            />
          )}

          {/* 5. বিস্তারিত প্রমাণ (Expandable) */}
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span>বিস্তারিত প্রমাণ ও সিস্টেম নোট ({result.findings.length} টি পর্যবেক্ষণ)</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-4 space-y-3 border-t border-slate-800/80 mt-3 text-xs text-slate-300">
              <p className="leading-relaxed text-slate-400 italic">
                {result.limitations}
              </p>
              <div className="space-y-2">
                {result.findings.map((f) => (
                  <div key={f.finding_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{f.field_label}</span>
                      <span className="text-[11px] font-mono text-slate-400">{f.status}</span>
                    </div>
                    <p className="text-slate-400">{f.explanation}</p>
                    {f.evidence_quote && (
                      <p className="text-slate-500 italic font-serif">&ldquo;{f.evidence_quote}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <EmptyState
          title="বিজ্ঞাপনের তথ্য যাচাই করুন"
          description="ফেসবুক পেজ বা অনলাইন শপের বিজ্ঞাপনের ক্যাপশন পেস্ট করুন অথবা স্ক্রিনশট আপলোড করে প্রাথমিক ফাঁকফোকর ও শর্ত পরীক্ষা করুন।"
        />
      )}
    </div>
  );
};
