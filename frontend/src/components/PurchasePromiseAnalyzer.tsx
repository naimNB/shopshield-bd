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
import { useLanguage } from '../context/LanguageContext';
import { ScreenshotUploader } from './shared/ScreenshotUploader';
import { BuyerQuestionsCard } from './shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from './shared/PaymentWarningsCard';
import { ProductAuthenticityCard } from './shared/ProductAuthenticityCard';
import { AssessmentSummaryBanner } from './shared/AssessmentSummaryBanner';
import { LoadingState, ErrorState } from './shared/StatusState';

export const PurchasePromiseAnalyzer: React.FC = () => {
  const { language, t } = useLanguage();

  const sampleScenarios = [
    {
      titleBn: 'দৃশ্যপট ১: বিজ্ঞাপনে COD বনাম চ্যাটে ১০০% অগ্রিম',
      titleEn: 'Scenario 1: Ad COD vs Chat 100% Advance',
      ad: 'শীতের প্রিমিয়াম উইন্টার জ্যাকেট মাত্র ১,৮৫০ টাকা! সারা দেশে ক্যাশ অন ডেলিভারি (COD) সুবিধা। পণ্য দেখে মূল্য পরিশোধ করুন। স্টক সীমিত, অর্ডার করতে এখনই ইনবক্স করুন!',
      chat: 'স্যার জ্যাকেট স্টকে আছে। কিন্তু এই অফার প্রাইজে কোনো ক্যাশ অন ডেলিভারি দেওয়া যাবে না। এখনই আমাদের পার্সোনাল বিকাশ নম্বরে ১,৮৫০ টাকা ফুল অ্যাডভান্স পাঠাতে হবে, তারপর পার্সেল বুক হবে।',
    },
    {
      titleBn: "দৃশ্যপট ২: যাচাইহীন '১০০% আসল' ঘড়ি দাবি",
      titleEn: "Scenario 2: Unverified 'Original' Watch Claim",
      ad: '100% Original Casio Edifice Chronograph Watch only 2,200 Tk! Authentic imported piece with original box and tags. Hurry, limited quantity available! Inbox to order.',
      chat: 'Yes sir 100% authentic original Casio watch. Official showroom price is 14,000 Tk but our wholesale imported price is only 2,200 Tk. Send 200 Tk courier charge advance to book.',
    },
    {
      titleBn: 'দৃশ্যপট ৩: শর্ত সামঞ্জস্যপূর্ণ',
      titleEn: 'Scenario 3: Consistent Verified Promises',
      ad: 'Premium Cotton Formal Shirt. Price 1250 BDT. Cash on Delivery available all over Bangladesh. 3 days easy return.',
      chat: 'Ji bhai, shirt price 1250 taka. Delivery charge 80 taka. Full Cash on Delivery te parcel nite parben. 3 diner moddhe size change kora jabe.',
    },
  ];

  const [adText, setAdText] = useState(sampleScenarios[0].ad);
  const [chatText, setChatText] = useState(sampleScenarios[0].chat);
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
    setAdText(sampleScenarios[index].ad);
    setChatText(sampleScenarios[index].chat);
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
      setError(
        language === 'bn'
          ? 'বিজ্ঞাপন এবং চ্যাট উভয়ের জন্যই কমপক্ষে ৫ অক্ষরের তথ্য প্রদান করুন।'
          : 'Please provide at least 5 characters for both the advertisement and chat text.'
      );
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentId = ++currentRequestIdRef.current;

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
      if (currentId === currentRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: unknown) {
      if (currentId === currentRequestIdRef.current) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
          return;
        }
        const msg =
          err instanceof Error
            ? err.message
            : language === 'bn'
            ? 'বিশ্লেষণ সম্পন্ন করা যায়নি।'
            : 'Analysis could not be completed.';
        setError(msg);
      }
    } finally {
      if (currentId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const contradictions = results?.comparison_results?.filter(
    (c: ComparisonItem) => c.status === 'CONTRADICTION'
  ) || [];

  const consistentItems = results?.comparison_results?.filter(
    (c: ComparisonItem) => c.status === 'CONSISTENT'
  ) || [];

  const needsReviewItems = results?.comparison_results?.filter(
    (c: ComparisonItem) => c.status === 'NEEDS_REVIEW'
  ) || [];

  const activeQuestions =
    language === 'en' && results?.buyer_questions_en && results.buyer_questions_en.length > 0
      ? results.buyer_questions_en
      : results?.buyer_questions_bangla || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-7">
      {/* Input Section */}
      <div className="bg-[#0f1728] border border-[#232f48] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-white font-sans">{t('tabAdVsChat')}</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
            {t('tabAdVsChatDesc')}
          </p>
        </div>

        {/* Sample Demonstration Scenarios */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-sans">{t('scenariosHeading')}</span>
          {sampleScenarios.map((scenario, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(idx)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[32px]"
            >
              {language === 'bn' ? scenario.titleBn : scenario.titleEn}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Ad Source */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="w2-ad-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>{t('adInputLabel')}</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {adText.length} {t('charCount')}
              </span>
            </div>
            <textarea
              id="w2-ad-input"
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              rows={7}
              placeholder={t('adPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
            <ScreenshotUploader
              label={t('uploadScreenshotBtn')}
              helperText={t('ocrDropHint')}
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
                <span>{t('chatInputLabel')}</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {chatText.length} {t('charCount')}
              </span>
            </div>
            <textarea
              id="w2-chat-input"
              value={chatText}
              onChange={(e) => {
                setChatText(e.target.value);
                if (error) setError(null);
              }}
              rows={7}
              placeholder={t('chatPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
            <ScreenshotUploader
              label={t('uploadScreenshotBtn')}
              helperText={t('ocrDropHint')}
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
            <span>{t('clearBtn')}</span>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || adText.trim().length < 5 || chatText.trim().length < 5}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{loading ? t('comparingBtn') : t('compareBtn')}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title={t('loadingStateTitle')}
          message={t('loadingStateDesc')}
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={handleAnalyze} />
      )}

      {/* Results Experience */}
      {results && !loading && (
        <div className="space-y-6">
          {/* 1. Top Assessment Summary Banner */}
          <AssessmentSummaryBanner
            assessment={results.overall_assessment}
            summary={results.assessment_summary}
          />

          {/* 2. Product Authenticity Card */}
          <ProductAuthenticityCard authenticity={results.product_authenticity} />

          {/* 3. Contradictions Section */}
          {contradictions.length > 0 && (
            <div className="rounded-2xl bg-rose-950/15 border border-rose-500/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t('contradictionsCardTitle')} ({contradictions.length})</span>
              </div>
              <div className="space-y-3">
                {contradictions.map((c: ComparisonItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-sm font-sans">{c.field_label}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {t('contradictionBadge')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">{c.explanation}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-sans">
                      <div className="p-2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        <span className="text-slate-400 block text-[11px] font-semibold">{t('adStatedLabel')}</span>
                        <blockquote className="italic font-serif">&ldquo;{c.ad_evidence || (language === 'bn' ? 'অনুল্লেখিত' : 'Not stated')}&rdquo;</blockquote>
                      </div>
                      <div className="p-2 rounded bg-slate-900 text-rose-200 border border-slate-800">
                        <span className="text-slate-400 block text-[11px] font-semibold">{t('chatStatedLabel')}</span>
                        <blockquote className="italic font-serif">&ldquo;{c.chat_evidence || (language === 'bn' ? 'অনুল্লেখিত' : 'Not stated')}&rdquo;</blockquote>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Consistent Terms */}
          {consistentItems.length > 0 && (
            <div className="rounded-2xl bg-emerald-950/15 border border-emerald-500/30 p-5 space-y-3">
              <span className="text-xs font-bold text-emerald-300 block font-sans uppercase tracking-wider">
                {language === 'bn' ? 'যেসব শর্তে মিল পাওয়া গেছে:' : 'Consistent Terms:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {consistentItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="text-slate-200 font-medium">
                      {item.field_label}: {language === 'bn' ? 'মিল রয়েছে' : 'Consistent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Payment Warnings Card */}
          {results.payment_warnings && results.payment_warnings.length > 0 && (
            <PaymentWarningsCard warnings={results.payment_warnings} />
          )}

          {/* 6. Needs Review Items */}
          {needsReviewItems.length > 0 && (
            <div className="rounded-2xl bg-amber-950/15 border border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{language === 'bn' ? 'যে তথ্যগুলো স্পষ্ট বা নিশ্চিত নয়' : 'Items Requiring Review'}</span>
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

          {/* 7. Actionable Buyer Verification Questions (Bilingual with One-Click Copy) */}
          {activeQuestions.length > 0 && (
            <BuyerQuestionsCard
              questions={activeQuestions}
              title={t('buyerQuestionsTitle')}
              description={t('buyerQuestionsSubtitle')}
            />
          )}

          {/* 8. Detailed Observable Findings (Expandable) */}
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span>
                  {language === 'bn' ? 'বিস্তারিত প্রমাণ ও সোর্স কোটেশন দেখুন' : 'View Detailed Evidence & Source Quotes'}
                </span>
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
                      <p className="text-slate-400 italic font-serif">
                        {language === 'bn' ? 'বিজ্ঞাপনের উদ্ধৃতি:' : 'Ad Quote:'} &ldquo;{item.ad_evidence}&rdquo;
                      </p>
                    )}
                    {item.chat_evidence && (
                      <p className="text-slate-400 italic font-serif">
                        {language === 'bn' ? 'চ্যাটের উদ্ধৃতি:' : 'Chat Quote:'} &ldquo;{item.chat_evidence}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {results.metadata?.execution_time_ms && (
                <p className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  {language === 'bn' ? 'বিশ্লেষণ সম্পন্ন:' : 'Analysis Execution:'} {results.metadata.execution_time_ms} ms
                </p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
