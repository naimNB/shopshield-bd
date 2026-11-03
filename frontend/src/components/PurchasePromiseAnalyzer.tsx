import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  ChevronDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  AnalyzeResponse,
  ComparisonItem,
} from '../types/api';
import { ScreenshotUploader } from './shared/ScreenshotUploader';
import { BuyerQuestionsCard } from './shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from './shared/PaymentWarningsCard';
import { LoadingState, ErrorState } from './shared/StatusState';

const SAMPLE_SCENARIOS = [
  {
    title: '১. মূল্য ও সিওডি গরমিল',
    ad: `স্মার্ট ওয়াচ প্রো ম্যাক্স! আকর্ষণীয় অফার মূল্য মাত্র ১২০০ টাকা। 
সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। 
৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি এবং ১ বছরের সার্ভিস ওয়ারেন্টি।`,
    chat: `হ্যালো ভাইয়া, ওয়াচটির বর্তমান দাম ১৫০০ টাকা। 
ঢাকার বাইরে ক্যাশ অন ডেলিভারি দেওয়া যাবে না। সম্পূর্ণ ১৫০০ টাকা আগে বিকাশ এ সেন্ড মানি করতে হবে। 
অর্ডার কনফার্ম করতে দ্রুত টাকা পাঠান, অফার শেষ হয়ে যাবে।`,
  },
  {
    title: '২. কুরিয়ার চার্জ অগ্রিম',
    ad: `Wireless Bluetooth Headphone with Deep Bass! 
Special Price: 2,500 BDT. Cash on Delivery available across Bangladesh. 
Original 1 Year Official Brand Warranty. 7 days checking warranty.`,
    chat: `Hello, price is 2500 taka. Delivery charge 150 taka advance bkash korte hobe to confirm parcel booking. 
Baki 2500 taka delivery er shomoy courier er kache COD te diben. 1 year warranty card thakbe.`,
  },
  {
    title: '৩. শর্ত সামঞ্জস্যপূর্ণ',
    ad: `Premium Cotton Formal Shirt. Price 1250 BDT. 
Cash on Delivery available all over Bangladesh. 3 days easy return.`,
    chat: `Ji bhai, shirt price 1250 taka. Delivery charge 80 taka. 
Full Cash on Delivery te parcel nite parben. 3 diner moddhe size change kora jabe.`,
  },
];

export const PurchasePromiseAnalyzer: React.FC = () => {
  const [adText, setAdText] = useState(SAMPLE_SCENARIOS[0].ad);
  const [chatText, setChatText] = useState(SAMPLE_SCENARIOS[0].chat);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);

  const currentRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadScenario = (index: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText(SAMPLE_SCENARIOS[index].ad);
    setChatText(SAMPLE_SCENARIOS[index].chat);
    setResults(null);
    setError(null);
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText('');
    setChatText('');
    setResults(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    const adClean = adText.trim();
    const chatClean = chatText.trim();

    if (adClean.length < 5 || chatClean.length < 5) {
      setError('বিজ্ঞাপন এবং চ্যাট উভয়ের জন্যই কমপক্ষে ৫ অক্ষরের তথ্য প্রদান করুন।');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++currentRequestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzeAdVsChat(
        {
          advertisement_text: adClean,
          seller_chat_text: chatClean,
        },
        { signal: controller.signal }
      );

      if (requestId === currentRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: unknown) {
      if (requestId === currentRequestIdRef.current) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
          return;
        }
        const msg = err instanceof Error ? err.message : 'প্রতিশ্রুতি যাচাই বিশ্লেষণ সম্পন্ন করা যায়নি।';
        setError(msg);
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const contradictions = results?.comparison_results?.filter(
    (c) => c.status === 'CONTRADICTION'
  ) || [];

  const needsReviewItems = results?.comparison_results?.filter(
    (c) => c.status === 'NEEDS_REVIEW' || c.status === 'INSUFFICIENT_INFORMATION'
  ) || [];

  const consistentItems = results?.comparison_results?.filter(
    (c) => c.status === 'CONSISTENT'
  ) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Form Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
        <div>
          <h3 className="text-xl font-bold text-white font-sans">
            বিজ্ঞাপন ও চ্যাট মিলিয়ে দেখুন
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
            বিজ্ঞাপনের প্রতিশ্রুতির সাথে ইনবক্সে বিক্রেতার কথার গরমিল, মূল্য বৃদ্ধি ও অগ্রিম পেমেন্টের ঝুঁকি পরীক্ষা করুন।
          </p>
        </div>

        {/* Sample Scenarios */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-sans">নমুনা পরিস্থিতি:</span>
          {SAMPLE_SCENARIOS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(idx)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[32px]"
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Dual Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Ad Source */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="w2-ad-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>বিজ্ঞাপনের অফার ও শর্ত</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{adText.length} অক্ষর</span>
            </div>
            <textarea
              id="w2-ad-input"
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              rows={7}
              placeholder="পাবলিক ফেসবুক পোস্ট বা বিজ্ঞাপনের অফার এখানে পেস্ট করুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
            <ScreenshotUploader
              label="বিজ্ঞাপনের স্ক্রিনশট (ঐচ্ছিক)"
              helperText="ফেসবুক বিজ্ঞাপনের স্ক্রিনশট থেকে টেক্সট এক্সট্রাক্ট করুন।"
              sourceType="advertisement"
              existingText={adText}
              onConfirmText={(text, mode) => {
                setAdText(mode === 'append' ? (adText.trim() ? `${adText.trim()}\n\n${text.trim()}` : text.trim()) : text.trim());
                if (error) setError(null);
              }}
            />
          </div>

          {/* Chat Source */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="w2-chat-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                <MessageSquare className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>ইনবক্সে বিক্রেতার চ্যাট বা মেসেজ</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{chatText.length} অক্ষর</span>
            </div>
            <textarea
              id="w2-chat-input"
              value={chatText}
              onChange={(e) => {
                setChatText(e.target.value);
                if (error) setError(null);
              }}
              rows={7}
              placeholder="মেসেঞ্জার বা হোয়াটসঅ্যাপে বিক্রেতার পাঠানো মেসেজ এখানে পেস্ট করুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
            <ScreenshotUploader
              label="চ্যাটের স্ক্রিনশট (ঐচ্ছিক)"
              helperText="মেসেঞ্জার বা হোয়াটসঅ্যাপ চ্যাটের স্ক্রিনশট থেকে টেক্সট এক্সট্রাক্ট করুন।"
              sourceType="seller_chat"
              existingText={chatText}
              onConfirmText={(text, mode) => {
                setChatText(mode === 'append' ? (chatText.trim() ? `${chatText.trim()}\n\n${text.trim()}` : text.trim()) : text.trim());
                if (error) setError(null);
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>মুছুন</span>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || adText.trim().length < 5 || chatText.trim().length < 5}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>প্রতিশ্রুতির গরমিল ও ঝুঁকি বিশ্লেষণ করুন</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title="বিজ্ঞাপন ও ইনবক্স চ্যাট তুলনা চলছে..."
          message="উভয় সোর্স থেকে প্রতিশ্রুত শর্তাবলি মিলিয়ে গরমিল ও পেমেন্ট ঝুঁকি বিশ্লেষণ করা হচ্ছে..."
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={handleAnalyze} />
      )}

      {/* Results Experience (Progressive Disclosure) */}
      {results && !loading && (
        <div className="space-y-6">
          {/* 1. সংক্ষেপে যা পাওয়া গেছে */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
              results.has_contradictions
                ? 'bg-rose-950/20 border-rose-500/40'
                : 'bg-emerald-950/20 border-emerald-500/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  results.has_contradictions
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {results.has_contradictions ? (
                  <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-sans">
                  {results.has_contradictions
                    ? `প্রতিশ্রুতির গরমিল সনাক্ত হয়েছে (${results.contradiction_count} টি)`
                    : 'বিজ্ঞাপন ও চ্যাটের তথ্যে কোনো গরমিল পাওয়া যায়নি'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans">
                  {results.has_contradictions
                    ? 'পাবলিক বিজ্ঞাপনের অফারের সাথে ইনবক্সে বিক্রেতার বক্তব্যের অমিল রয়েছে।'
                    : 'বিজ্ঞাপনে উল্লেখিত বাণিজ্যিক শর্তাবলি এবং চ্যাটের বিবরণ পরস্পর সামঞ্জস্যপূর্ণ।'}
                </p>
                {results.contradiction_count > 0 && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {results.contradiction_count} টি গরমিল
                  </span>
                )}
              </div>
            </div>

            {/* Stated comparison at a glance */}
            {consistentItems.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block mb-2 font-sans">
                  যেসব শর্তে মিল পাওয়া গেছে:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {consistentItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                      <span className="text-slate-200">{item.field_label}: মিল রয়েছে</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. গরমিল বা সতর্কতা */}
          {contradictions.length > 0 && (
            <div className="rounded-2xl bg-rose-950/15 border border-rose-500/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>শনাক্তকৃত গরমিলসমূহ (Contradictions)</span>
              </div>
              <div className="space-y-3">
                {contradictions.map((c: ComparisonItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-sm font-sans">{c.field_label}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        গরমিল
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">{c.explanation}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-sans">
                      <div className="p-2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">বিজ্ঞাপনে:</span>
                        <span>{c.ad_evidence || 'অনুল্লেখিত'}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 text-rose-200 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">ইনবক্স চ্যাটে:</span>
                        <span>{c.chat_evidence || 'অনুল্লেখিত'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Considerations Warnings */}
          {results.payment_warnings && results.payment_warnings.length > 0 && (
            <PaymentWarningsCard warnings={results.payment_warnings} />
          )}

          {/* 3. যে তথ্যগুলো নিশ্চিত নয় */}
          {needsReviewItems.length > 0 && (
            <div className="rounded-2xl bg-amber-950/15 border border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>যে তথ্যগুলো স্পষ্ট বা নিশ্চিত নয়</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 font-sans">
                {needsReviewItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>
                      <strong className="text-slate-100">{item.field_label}:</strong> {item.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. কেনার আগে যা জিজ্ঞেস করবেন */}
          {results.buyer_questions_bangla?.length > 0 && (
            <BuyerQuestionsCard
              questions={results.buyer_questions_bangla}
              title="কেনার আগে বিক্রেতাকে যা জিজ্ঞেস করবেন"
              description="অর্ডার চূড়ান্ত করার আগে নিচের প্রশ্নগুলো বিক্রেতাকে পাঠিয়ে লিখিত নিশ্চিতকরণ গ্রহণ করুন:"
            />
          )}

          {/* 5. বিস্তারিত প্রমাণ (Expandable) */}
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span>বিস্তারিত প্রমাণ ও সোর্স কোটেশন দেখুন</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-4 space-y-3 border-t border-slate-800/80 mt-3 text-xs text-slate-300">
              <div className="space-y-2">
                {results.comparison_results?.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.field_label}</span>
                      <span className="text-[11px] font-mono text-slate-400">{item.status}</span>
                    </div>
                    {item.ad_evidence && (
                      <p className="text-slate-400 italic font-serif">বিজ্ঞাপনের উদ্ধৃতি: &ldquo;{item.ad_evidence}&rdquo;</p>
                    )}
                    {item.chat_evidence && (
                      <p className="text-slate-400 italic font-serif">চ্যাটের উদ্ধৃতি: &ldquo;{item.chat_evidence}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
              {results.metadata?.execution_time_ms && (
                <p className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  বিশ্লেষণ সম্পন্ন: {results.metadata.execution_time_ms} ms
                </p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
