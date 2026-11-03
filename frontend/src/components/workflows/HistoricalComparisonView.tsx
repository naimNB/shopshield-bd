import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  ExternalLink,
  FileText,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Quote,
} from 'lucide-react';
import { api } from '../../services/api';
import type { CompareHistoryResponse, TemporalFieldComparison } from '../../types/api';
import { EvidenceBadge } from '../shared/EvidenceBadge';
import { BuyerQuestionsCard } from '../shared/BuyerQuestionsCard';
import { LoadingState, ErrorState, EmptyState } from '../shared/StatusState';

const SAMPLE_COMPARISONS = [
  {
    title: 'দারাজ বাংলাদেশ (Daraz BD)',
    url: 'https://daraz.com.bd',
    path: '',
    note: 'বৃহৎ ই-কমার্স প্ল্যাটফর্মের হোমপেজ ও পলিসি হিস্টোরি',
  },
  {
    title: 'চালডাল গ্রোসারি (Chaldal)',
    url: 'https://chaldal.com',
    path: '',
    note: 'ডেলিভারি ও ক্যাশ অন ডেলিভারি হিস্টোরিক্যাল রেকর্ড',
  },
  {
    title: 'রকমারি ডট কম (Rokomari)',
    url: 'https://rokomari.com',
    path: '',
    note: 'দীর্ঘমেয়াদী আর্কাইভ কভারেজ এবং পরিবর্তন ট্র্যাকিং',
  },
];

export const HistoricalComparisonView: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareHistoryResponse | null>(null);

  const handleCompare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!websiteUrl.trim()) {
      setError('অনুগ্রহ করে একটি ওয়েবসাইটের লিঙ্ক দিন (যেমন: https://daraz.com.bd)।');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.compareHistoricalPolicy({
        website_url: websiteUrl.trim(),
        page_path: pagePath.trim() || undefined,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ঐতিহাসিক তুলনা সম্পন্ন করা সম্ভব হয়নি।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWebsiteUrl('');
    setPagePath('');
    setResult(null);
    setError(null);
  };

  const loadSample = (sample: typeof SAMPLE_COMPARISONS[0]) => {
    setWebsiteUrl(sample.url);
    setPagePath(sample.path);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-sans">
              ঐতিহাসিক নীতিমালা ও মূল্য পরিবর্তন (Policy & Price Evolution)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              ইন্টারনেট আর্কাইভের সংরক্ষিত স্ন্যাপশট তুলনা করে রিটার্ন পলিসি, ওয়ারেন্টি ও মূল্যের পরিবর্তন পর্যবেক্ষণ করুন
            </p>
          </div>
        </div>

        {/* Sample Loaders */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">নমুনা ওয়েবসাইট:</span>
          {SAMPLE_COMPARISONS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(sample)}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCompare} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>ওয়েবসাইট বা পেজের URL</span>
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://daraz.com.bd অথবা https://example.com/refund"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>নির্দিষ্ট পেজ পাথ (ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={pagePath}
              onChange={(e) => setPagePath(e.target.value)}
              placeholder="/return-policy"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            Wayback Machine CDX এ সংরক্ষিত ভিন্ন ভিন্ন সময়ের দুটি স্ন্যাপশট এনে তুলনা করা হয়।
          </p>

          <div className="flex items-center gap-3">
            {websiteUrl && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !websiteUrl.trim()}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>আর্কাইভ তুলনা করুন</span>
            </button>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title="ওয়েব আর্কাইভ স্ন্যাপশট সংগ্রহ ও বিশ্লেষণ চলছে..."
          message="ইন্টারনেট আর্কাইভ থেকে পূর্বের ও সাম্প্রতিক স্ন্যাপশট সংগ্রহ করে নীতিমালা মিলিয়ে দেখা হচ্ছে..."
          steps={[
            'Wayback Machine CDX API থেকে স্ন্যাপশটের তালিকা অনুসন্ধান করা হচ্ছে...',
            'আগের এবং পরের স্ন্যাপশটের এইচটিএমএল কনটেন্ট নিরাপদে স্যানিটাইজ করা হচ্ছে...',
            'রিটার্ন পলিসি, রিপ্লেসমেন্ট, ডেলিভারি ফি এবং মূল্যের পরিবর্তন সনাক্ত করা হচ্ছে...',
          ]}
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => handleCompare()} />
      )}

      {/* Results Section */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Header Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block">
                  ডোমেইন: {result.cleaned_domain}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  ঐতিহাসিক বিশ্লেষণের ফলাফল ({result.target_url})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  কভারেজ: {result.coverage_status}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  স্কোপ: {result.comparison_scope}
                </span>
              </div>
            </div>

            {/* Scope Explanation if restricted */}
            {result.scope_explanation && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{result.scope_explanation}</p>
              </div>
            )}

            {/* Change Summary Indicator */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm">
              {result.has_changes ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-200">
                    <strong className="text-amber-400">{result.changes_count} টি</strong> নীতিমালায় পরিবর্তন সনাক্ত করা হয়েছে।
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">
                    আর্কাইভ স্ন্যাপশটগুলোর মধ্যে কোনো বৈপরীত্য বা নীতিমালার পরিবর্তন পাওয়া যায়নি।
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Snapshots Comparison Side-by-Side */}
          {(result.earlier_snapshot || result.later_snapshot) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earlier Snapshot */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>পূর্ববর্তী স্ন্যাপশট (Earlier Snapshot)</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {result.earlier_snapshot?.formatted_date || 'তারিখ অপ্রতুল'}
                  </span>
                </div>
                {result.earlier_snapshot?.snapshot_url && (
                  <a
                    href={result.earlier_snapshot.snapshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    <span>আর্কাইভ পেজ দেখুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                  <p>পেজ ধরণ: {result.earlier_snapshot?.page_type}</p>
                  <p>সাইজ: {((result.earlier_snapshot?.content_bytes || 0) / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              {/* Later Snapshot */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>পরবর্তী স্ন্যাপশট (Later Snapshot)</span>
                  </span>
                  <span className="font-mono text-indigo-300 text-[11px]">
                    {result.later_snapshot?.formatted_date || 'তারিখ অপ্রতুল'}
                  </span>
                </div>
                {result.later_snapshot?.snapshot_url && (
                  <a
                    href={result.later_snapshot.snapshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    <span>আর্কাইভ পেজ দেখুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                  <p>পেজ ধরণ: {result.later_snapshot?.page_type}</p>
                  <p>সাইজ: {((result.later_snapshot?.content_bytes || 0) / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            </div>
          )}

          {/* Temporal Field Comparisons List */}
          {result.comparisons.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>ক্ষেত্রভিত্তিক পরিবর্তন পর্যবেক্ষণ (Field-by-Field Evolution)</span>
              </h4>

              <div className="space-y-3">
                {result.comparisons.map((item: TemporalFieldComparison, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 sm:p-5 space-y-3 ${
                      item.status === 'CHANGED'
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm sm:text-base">
                          {item.field_label}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.field}
                        </span>
                      </div>
                      <EvidenceBadge status={item.status} />
                    </div>

                    {/* Comparison Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          আগের মান ({item.earlier_date || 'তারিখ নেই'}):
                        </span>
                        <p className="font-semibold text-slate-200">
                          {item.previous_value || 'তথ্য পাওয়া যায়নি'}
                        </p>
                        {item.earlier_evidence_quote && (
                          <div className="mt-2 text-[11px] text-slate-400 italic font-serif border-l border-slate-700 pl-2">
                            <Quote className="w-3 h-3 text-slate-500 inline mr-1" />
                            &ldquo;{item.earlier_evidence_quote}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-indigo-400 font-medium block">
                          সাম্প্রতিক মান ({item.later_date || 'তারিখ নেই'}):
                        </span>
                        <p className="font-semibold text-slate-200">
                          {item.new_value || 'তথ্য পাওয়া যায়নি'}
                        </p>
                        {item.later_evidence_quote && (
                          <div className="mt-2 text-[11px] text-slate-400 italic font-serif border-l border-indigo-500/50 pl-2">
                            <Quote className="w-3 h-3 text-indigo-400 inline mr-1" />
                            &ldquo;{item.later_evidence_quote}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {item.explanation}
                    </p>

                    {/* Limitations */}
                    {item.limitations && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">সীমাবদ্ধতা:</strong> {item.limitations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Questions Card */}
          {result.buyer_questions_bangla && result.buyer_questions_bangla.length > 0 && (
            <BuyerQuestionsCard
              questions={result.buyer_questions_bangla}
              title="পলিসি পরিবর্তনের প্রেক্ষিতে বিক্রেতাকে যা জিজ্ঞাসা করবেন"
              description="পূর্বে ও বর্তমানে নীতিমালায় যে পরিবর্তন লক্ষ্য করা গেছে, তা পরিষ্কার করতে বিক্রেতাকে এই প্রশ্নগুলো করুন:"
            />
          )}

          {/* System Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">ভোক্তা অধিকার ও ঐতিহাসিক ডেটা ডিসক্লেইমার:</p>
            <p className="leading-relaxed">{result.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <EmptyState
          title="ওয়েবসাইট আর্কাইভ ইতিহাস অনুসন্ধান করুন"
          description="উপরে যেকোনো ই-কমার্স ওয়েবসাইটের ইউআরএল দিন এবং অতীতে তাদের নীতিমালায় কোনো উল্লেখযোগ্য পরিবর্তন এসেছে কি না তা দেখুন।"
        />
      )}
    </div>
  );
};
