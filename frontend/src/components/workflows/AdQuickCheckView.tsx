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
import { useLanguage } from '../../context/LanguageContext';
import { ScreenshotUploader } from '../shared/ScreenshotUploader';
import { BuyerQuestionsCard } from '../shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from '../shared/PaymentWarningsCard';
import { ProductAuthenticityCard } from '../shared/ProductAuthenticityCard';
import { AssessmentSummaryBanner } from '../shared/AssessmentSummaryBanner';
import { LoadingState, ErrorState, EmptyState } from '../shared/StatusState';

export const AdQuickCheckView: React.FC = () => {
  const { language, t } = useLanguage();
  const [adText, setAdText] = useState('');
  const [productContext, setProductContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdAnalysisResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const sampleScenarios = [
    {
      titleBn: 'দৃশ্যপট ১: বিজ্ঞাপনে COD',
      titleEn: 'Scenario 1: Ad COD',
      text: 'শীতের প্রিমিয়াম উইন্টার জ্যাকেট মাত্র ১,৮৫০ টাকা! সারা দেশে ক্যাশ অন ডেলিভারি (COD) সুবিধা। পণ্য দেখে মূল্য পরিশোধ করুন। স্টক সীমিত, অর্ডার করতে এখনই ইনবক্স করুন!',
      product: 'উইন্টার জ্যাকেট',
    },
    {
      titleBn: "দৃশ্যপট ২: যাচাইহীন '১০০% আসল' ঘড়ি দাবি",
      titleEn: "Scenario 2: Unverified 'Original' Watch Claim",
      text: '100% Original Casio Edifice Chronograph Watch only 2,200 Tk! Authentic imported piece with original box and tags. Hurry, limited quantity available! Inbox to order.',
      product: 'Casio Edifice Watch',
    },
    {
      titleBn: 'দৃশ্যপট ৩: স্পষ্ট শর্তযুক্ত বিজ্ঞাপন',
      titleEn: 'Scenario 3: Verified Clear Terms',
      text: 'Winter Fleece Hoodie price 1,200 Tk. Cash on Delivery available across Bangladesh. Delivery charge 100 Tk. 7 days exchange policy. 6 months warranty.',
      product: 'Fleece Hoodie',
    },
  ];

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
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে বিজ্ঞাপনের টেক্সট লিখুন অথবা স্ক্রিনশট আপলোড করুন (কমপক্ষে ৫ অক্ষর)।'
          : 'Please enter advertisement text or upload a screenshot (at least 5 characters).'
      );
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
        const msg =
          err instanceof Error
            ? err.message
            : language === 'bn'
            ? 'বিজ্ঞাপন বিশ্লেষণ সম্পন্ন করা যায়নি।'
            : 'Advertisement verification could not be completed.';
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

  const loadSample = (sample: (typeof sampleScenarios)[0]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText(sample.text);
    setProductContext(sample.product);
    setResult(null);
    setError(null);
  };

  const claims = result?.advertisement_claims;
  const activeQuestions =
    language === 'en' && result?.buyer_questions_en && result.buyer_questions_en.length > 0
      ? result.buyer_questions_en
      : result?.buyer_questions_bangla || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-7">
      {/* Form Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
        <div>
          <h3 className="text-xl font-bold text-white font-sans">{t('tabAdCheck')}</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
            {t('tabAdCheckDesc')}
          </p>
        </div>

        {/* Sample Demonstration Scenarios */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-sans">{t('scenariosHeading')}</span>
          {sampleScenarios.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[32px]"
            >
              {language === 'bn' ? sample.titleBn : sample.titleEn}
            </button>
          ))}
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ad-text-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                <span>{t('adInputLabel')}</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {adText.length} {t('charCount')}
              </span>
            </div>
            <textarea
              id="ad-text-input"
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t('adPlaceholder')}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors font-sans leading-relaxed"
            />
          </div>

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

          <div className="flex items-center justify-between pt-2">
            {result ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('clearBtn')}</span>
              </button>
            ) : <span />}

            <button
              type="submit"
              disabled={loading || !adText.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>{loading ? t('analyzingAdBtn') : t('analyzeAdBtn')}</span>
            </button>
          </div>
        </form>
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
        <ErrorState message={error} onRetry={() => handleAnalyze()} />
      )}

      {/* Results Experience */}
      {result && !loading && (
        <div className="space-y-6">
          {/* 1. Top Summary Banner (High-Level Assessment State) */}
          <AssessmentSummaryBanner
            assessment={result.overall_assessment}
            summary={result.assessment_summary}
          />

          {/* 2. Product Authenticity Card */}
          <ProductAuthenticityCard authenticity={result.product_authenticity} />

          {/* 3. Summary of Extracted Terms */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 space-y-4">
            <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" aria-hidden="true" />
              <span>{language === 'bn' ? 'বিজ্ঞাপনে পাওয়া দৃশ্যমান শর্তাবলী' : 'Observed Commercial Terms'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">{language === 'bn' ? 'পণ্য' : 'Product'}</span>
                <span className="font-semibold text-slate-100">{claims?.product_name || (language === 'bn' ? 'নির্দিষ্ট নয়' : 'Not specified')}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">{language === 'bn' ? 'বিজ্ঞাপিত মূল্য' : 'Advertised Price'}</span>
                <span className="font-semibold text-teal-300">
                  {claims?.price ? `৳ ${claims.price.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}` : (language === 'bn' ? 'অনুল্লেখিত' : 'Not stated')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">{language === 'bn' ? 'ক্যাশ অন ডেলিভারি (সিওডি)' : 'Cash on Delivery (COD)'}</span>
                <span className="font-semibold text-slate-100">
                  {claims?.cod_available === true
                    ? (language === 'bn' ? 'উপলব্ধ (Available)' : 'Available')
                    : claims?.cod_available === false
                    ? (language === 'bn' ? 'অনুপলব্ধ (Not Available)' : 'Explicitly Denied')
                    : (language === 'bn' ? 'বিজ্ঞাপনে উল্লেখ নেই' : 'Not mentioned')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-xs">{language === 'bn' ? 'ডেলিভারি ও অগ্রিম শর্ত' : 'Delivery & Advance Terms'}</span>
                <span className="font-semibold text-slate-100">
                  {claims?.advance_payment_required
                    ? (language === 'bn'
                        ? `অগ্রিম প্রয়োজন: ৳ ${claims.advance_payment_amount || 'অনির্দিষ্ট'}`
                        : `Advance required: ৳ ${claims.advance_payment_amount || 'Unspecified'}`)
                    : claims?.delivery_conditions || (language === 'bn' ? 'শর্ত উল্লেখ নেই' : 'No conditions stated')}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Payment Warnings & Considerations */}
          {result.payment_considerations.length > 0 && (
            <PaymentWarningsCard warnings={result.payment_considerations} />
          )}

          {/* 5. Missing Critical Information */}
          {result.missing_critical_info.length > 0 && (
            <div className="rounded-2xl bg-amber-950/15 border border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t('missingInfoTitle')}</span>
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

          {/* 6. Actionable Buyer Verification Questions (Bilingual with One-Click Copy) */}
          {activeQuestions.length > 0 && (
            <BuyerQuestionsCard
              questions={activeQuestions}
              title={t('buyerQuestionsTitle')}
              description={t('buyerQuestionsSubtitle')}
            />
          )}

          {/* 7. Detailed Observable Findings (Expandable) */}
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span>
                  {language === 'bn'
                    ? `বিস্তারিত প্রমাণ ও পর্যবেক্ষণ (${result.findings.length} টি)`
                    : `Detailed Findings & Evidence (${result.findings.length} items)`}
                </span>
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
          title={t('emptyStateTitle')}
          description={t('emptyStateDesc')}
        />
      )}
    </div>
  );
};
