import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Upload,
  X,
  ExternalLink,
  AlertCircle,
  Calendar,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  PageTransparencyData,
  WebsiteArchiveData,
  SellerHistoryReportResponse,
} from '../types/api';
import { HistoricalComparisonView } from './workflows/HistoricalComparisonView';
import { BuyerQuestionsCard } from './shared/BuyerQuestionsCard';
import { LoadingState } from './shared/StatusState';

export const SellerHistoryIntelligence: React.FC = () => {
  // Mode switch: profile research (default) vs historical policy comparison (advanced)
  const [activeSubMode, setActiveSubMode] = useState<'profile' | 'comparison'>('profile');

  // Page Transparency Screenshot State
  const [transparencyFile, setTransparencyFile] = useState<File | null>(null);
  const [transparencyPreview, setTransparencyPreview] = useState<string | null>(null);
  const [transparencyLoading, setTransparencyLoading] = useState(false);
  const [transparencyError, setTransparencyError] = useState<string | null>(null);
  const [transparencyData, setTransparencyData] = useState<PageTransparencyData | null>(null);

  // Website Historical Research State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteArchiveData | null>(null);

  // Consolidated Report State
  const [report, setReport] = useState<SellerHistoryReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Hidden file input ref and abort controllers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transparencyAbortRef = useRef<AbortController | null>(null);
  const websiteAbortRef = useRef<AbortController | null>(null);
  const reportAbortRef = useRef<AbortController | null>(null);

  // Detect #compare or #historical-comparison hash to auto-switch to advanced comparison
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#compare' || hash === '#historical-comparison' || hash === '#policy-evolution') {
        setActiveSubMode('comparison');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    return () => {
      if (transparencyAbortRef.current) transparencyAbortRef.current.abort();
      if (websiteAbortRef.current) websiteAbortRef.current.abort();
      if (reportAbortRef.current) reportAbortRef.current.abort();
      setTransparencyPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setTransparencyError('PNG, JPEG, এবং WebP ফরম্যাটের স্ক্রিনশট আপলোড করুন।');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setTransparencyError('ফাইলের সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    if (transparencyAbortRef.current) {
      transparencyAbortRef.current.abort();
    }

    setTransparencyFile(file);
    if (transparencyPreview) URL.revokeObjectURL(transparencyPreview);
    setTransparencyPreview(URL.createObjectURL(file));
    setTransparencyError(null);
  };

  const handleRemoveImage = () => {
    if (transparencyAbortRef.current) {
      transparencyAbortRef.current.abort();
    }
    setTransparencyFile(null);
    if (transparencyPreview) {
      URL.revokeObjectURL(transparencyPreview);
      setTransparencyPreview(null);
    }
    setTransparencyData(null);
    setTransparencyError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // OCR Extraction for Page Transparency Screenshot
  const handleProcessScreenshot = async () => {
    if (!transparencyFile) return;

    if (transparencyAbortRef.current) {
      transparencyAbortRef.current.abort();
    }
    const controller = new AbortController();
    transparencyAbortRef.current = controller;

    setTransparencyLoading(true);
    setTransparencyError(null);

    try {
      const json = await api.analyzePageTransparency(transparencyFile, { signal: controller.signal });
      setTransparencyData(json.transparency_data);

      await fetchConsolidatedReport(json.transparency_data, websiteUrl.trim());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'স্ক্রিনশট বিশ্লেষণ ব্যর্থ হয়েছে।';
      setTransparencyError(msg);
    } finally {
      setTransparencyLoading(false);
    }
  };

  // Website Historical Research via Wayback Machine
  const handleResearchWebsite = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || websiteUrl;
    if (!targetUrl.trim()) {
      setWebsiteError('অনুগ্রহ করে ওয়েবসাইটের লিঙ্ক দিন (যেমন: https://chaldal.com)।');
      return;
    }

    if (websiteAbortRef.current) {
      websiteAbortRef.current.abort();
    }
    const controller = new AbortController();
    websiteAbortRef.current = controller;

    setWebsiteLoading(true);
    setWebsiteError(null);

    try {
      const json = await api.fetchWebsiteHistory(targetUrl.trim(), { signal: controller.signal });
      setWebsiteData(json.website_data);

      await fetchConsolidatedReport(transparencyData, targetUrl.trim());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'ওয়েবসাইট আর্কাইভ অনুসন্ধান ব্যর্থ হয়েছে।';
      setWebsiteError(msg);
    } finally {
      setWebsiteLoading(false);
    }
  };

  // Consolidated Intelligence Report
  const fetchConsolidatedReport = async (
    tData: PageTransparencyData | null,
    wUrl: string
  ) => {
    if (!tData && !wUrl) return;

    if (reportAbortRef.current) {
      reportAbortRef.current.abort();
    }
    const controller = new AbortController();
    reportAbortRef.current = controller;

    setReportLoading(true);
    try {
      const rep = await api.fetchSellerHistoryReport({
        website_url: wUrl || undefined,
        transparency_data: tData || undefined,
      }, { signal: controller.signal });
      setReport(rep);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Soft fail for optional consolidated report
    } finally {
      setReportLoading(false);
    }
  };

  const handleResetAll = () => {
    handleRemoveImage();
    setWebsiteUrl('');
    setWebsiteData(null);
    setWebsiteError(null);
    setReport(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Sub-mode selector */}
      <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveSubMode('profile')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeSubMode === 'profile'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          বিক্রেতার প্রোফাইল ও ওয়েব রেকর্ড
        </button>
        <button
          type="button"
          onClick={() => setActiveSubMode('comparison')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeSubMode === 'comparison'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          পূর্ববর্তী পলিসি ও মূল্যের পরিবর্তন
        </button>
      </div>

      {/* Render Historical Comparison View if in comparison mode */}
      {activeSubMode === 'comparison' ? (
        <HistoricalComparisonView />
      ) : (
        <div className="space-y-6">
          {/* Main Website Form Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white font-sans">
                বিক্রেতার ইতিহাস ও আর্কাইভ যাচাই
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
                অনলাইন শপের ওয়েবসাইট আর্কাইভ এবং ফেসবুক পেজ ট্রান্সপারেন্সির নির্ভরযোগ্য রেকর্ড অনুসন্ধান করুন।
              </p>
            </div>

            {/* Sample Links */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 font-sans">নমুনা লিঙ্ক:</span>
              {['https://chaldal.com', 'https://daraz.com.bd', 'https://rokomari.com'].map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setWebsiteUrl(url);
                    handleResearchWebsite(url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors font-mono min-h-[32px]"
                >
                  {url.replace('https://', '')}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleResearchWebsite(); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                  <Globe className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                  <span>অনলাইন শপ ওয়েবসাইট লিঙ্ক</span>
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://daraz.com.bd অথবা chaldal.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors"
                />
              </div>

              {websiteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{websiteError}</span>
                </div>
              )}

              {/* Optional Facebook Page Transparency Screen Upload */}
              <details className="group rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs">
                <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white flex items-center justify-between select-none">
                  <span>ফেসবুক পেজ ট্রান্সপারেন্সি স্ক্রিনশট যোগ করুন (ঐচ্ছিক)</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-3 space-y-3">
                  <p className="text-slate-400 text-xs">
                    ফেসবুক পেজের 'Page Transparency' বা 'About' সেকশনের স্ক্রিনশট আপলোড করলে পেজ তৈরির তারিখ ও পূর্বের নাম পরিবর্তন পরীক্ষা করা হবে।
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {!transparencyFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-teal-500/60 bg-slate-900/40 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-teal-400" />
                      <span>স্ক্রিনশট ফাইল নির্বাচন করুন</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-[#0a1224] p-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        {transparencyPreview && (
                          <img
                            src={transparencyPreview}
                            alt="Transparency preview"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{transparencyFile.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {(transparencyFile.size / 1024).toFixed(1)} KB
                          </p>
                          {transparencyData && (
                            <div className="flex items-center gap-1 text-[11px] text-teal-300 mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>পেজ: {transparencyData.page_name || 'সনাক্ত হয়েছে'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={handleProcessScreenshot}
                            disabled={transparencyLoading}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors disabled:opacity-50 min-h-[36px]"
                          >
                            {transparencyLoading ? 'OCR হচ্ছে...' : transparencyData ? 'পুনরায় বিশ্লেষণ' : 'বিশ্লেষণ করুন'}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            aria-label="ছবি মুছে ফেলুন"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {transparencyError && (
                    <p className="text-rose-400 text-xs">{transparencyError}</p>
                  )}
                </div>
              </details>

              <div className="flex items-center justify-between pt-2">
                {(websiteUrl || websiteData || transparencyFile) ? (
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 min-h-[44px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>রিসেট করুন</span>
                  </button>
                ) : <span />}

                <button
                  type="submit"
                  disabled={!websiteUrl.trim() || websiteLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  <span>{websiteLoading ? 'আর্কাইভ অনুসন্ধান হচ্ছে...' : 'ওয়েবসাইট ইতিহাস অনুসন্ধান করুন'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Loading State */}
          {(websiteLoading || reportLoading) && (
            <LoadingState
              title="ওয়েব আর্কাইভ অনুসন্ধান চলছে..."
              message="Wayback Machine CDX API থেকে ডোমেইনের সংরক্ষিত ইতিহাস সংগ্রহ করা হচ্ছে..."
            />
          )}

          {/* Results: Progressive Disclosure */}
          {websiteData && !websiteLoading && (
            <div className="space-y-6">
              {/* 1. সংক্ষেপে যা পাওয়া গেছে */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" aria-hidden="true" />
                    <span>সংক্ষেপে যা পাওয়া গেছে (ডোমেইন: {websiteData.cleaned_domain})</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    স্বাধীন ওয়েব আর্কাইভ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-xs">প্রথম সংরক্ষিত স্ন্যাপশট</span>
                    <span className="font-semibold text-slate-100 font-mono">
                      {websiteData.earliest_snapshot?.formatted_date || 'আর্কাইভ নেই'}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-xs">মোট আর্কাইভ নমুনা</span>
                    <span className="font-semibold text-slate-100 font-mono">
                      {websiteData.archive_available
                        ? `${websiteData.sample_snapshots_count || websiteData.total_snapshots_observed} টি স্ন্যাপশট`
                        : 'সংরক্ষিত স্ন্যাপশট নেই'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans italic">
                  ℹ️ প্রথম আর্কাইভ তারিখ ডোমেইন খোলার বা ব্যবসা প্রতিষ্ঠার প্রমাণ নয়। এটি কেবল ওয়েব আর্কাইভে প্রথম রেকর্ড হওয়ার প্রমাণ।
                </p>
              </div>

              {/* 2. স্বাধীন ওয়েব আর্কাইভ লিঙ্ক */}
              {websiteData.archive_available && websiteData.sample_snapshots.length > 0 && (
                <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 font-sans">
                      যাচাইযোগ্য পাবলিক আর্কাইভ লিঙ্কসমূহ:
                    </span>
                    <span className="text-[11px] text-teal-400 font-mono">Wayback Machine</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {websiteData.sample_snapshots.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.snapshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-teal-400 hover:text-teal-300 border border-slate-800 transition-colors font-mono"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.formatted_date}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. পেজ ট্রান্সপারেন্সি ফলাফল (যদি থাকে) */}
              {transparencyData && (
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
                  <h4 className="text-sm font-bold text-slate-100 font-sans">ফেসবুক পেজ রেকর্ড</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">পেজের নাম:</span>
                      <span className="font-semibold text-slate-200">{transparencyData.page_name || 'অনুল্লেখিত'}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">পেজ তৈরির তারিখ:</span>
                      <span className="font-semibold text-slate-200">{transparencyData.page_creation_date || 'অনুল্লেখিত'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. কেনার আগে যা জিজ্ঞেস করবেন */}
              {report?.buyer_verification_questions && report.buyer_verification_questions.length > 0 && (
                <BuyerQuestionsCard
                  questions={report.buyer_verification_questions}
                  title="বিক্রেতার বিশ্বাসযোগ্যতা যাচাইয়ে করণীয় প্রশ্ন"
                />
              )}

              {/* 5. বিস্তারিত প্রমাণ (Expandable) */}
              <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all">
                <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>বিস্তারিত প্রমাণ ও সোর্স মেটাডাটা</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-4 space-y-2 border-t border-slate-800/80 mt-3 text-xs text-slate-400 font-mono">
                  <p>ডোমেইন: {websiteData.cleaned_domain}</p>
                  <p>সার্চ ইউআরএল: {websiteData.target_url}</p>
                  <p>সিডিএক্স কভারেজ: {websiteData.archive_available ? 'রেকর্ড পাওয়া গেছে' : 'রেকর্ড নেই'}</p>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
