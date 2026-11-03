import React, { useState, useRef, useEffect } from 'react';
import {
  History,
  Globe,
  Upload,
  X,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Calendar,
  Layers,
  MapPin,
  Shield,
  FileQuestion,
  Info,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  PageTransparencyData,
  WebsiteArchiveData,
  SellerHistoryReportResponse,
} from '../types/api';
import { BuyerQuestionsCard } from './shared/BuyerQuestionsCard';
import { LoadingState } from './shared/StatusState';

export const SellerHistoryIntelligence: React.FC = () => {
  // Page Transparency Screenshot State
  const [transparencyFile, setTransparencyFile] = useState<File | null>(null);
  const [transparencyPreview, setTransparencyPreview] = useState<string | null>(null);
  const [transparencyLoading, setTransparencyLoading] = useState(false);
  const [transparencyError, setTransparencyError] = useState<string | null>(null);
  const [transparencyData, setTransparencyData] = useState<PageTransparencyData | null>(null);

  // Editable fields for user review & correction
  const [editPageName, setEditPageName] = useState('');
  const [editCreationDate, setEditCreationDate] = useState('');

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

  // Analyze Page Transparency Screenshot
  const handleAnalyzeTransparency = async () => {
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
      setEditPageName(json.transparency_data.page_name || '');
      setEditCreationDate(json.transparency_data.page_creation_date || '');

      // Trigger consolidated report update
      await fetchConsolidatedReport(json.transparency_data, websiteUrl);
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'স্ক্রিনশট বিশ্লেষণ ব্যর্থ হয়েছে।';
      setTransparencyError(msg);
    } finally {
      setTransparencyLoading(false);
    }
  };

  // Research Website History via Wayback Machine
  const handleResearchWebsite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!websiteUrl.trim()) {
      setWebsiteError('অনুগ্রহ করে একটি ওয়েবসাইটের লিঙ্ক দিন (যেমন: https://daraz.com.bd)');
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
      const json = await api.fetchWebsiteHistory(websiteUrl.trim(), { signal: controller.signal });
      setWebsiteData(json.website_data);

      // Trigger consolidated report update
      await fetchConsolidatedReport(transparencyData, websiteUrl.trim());
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'ওয়েবসাইট আর্কাইভ অনুসন্ধান ব্যর্থ হয়েছে।';
      setWebsiteError(msg);
    } finally {
      setWebsiteLoading(false);
    }
  };

  // Fetch Consolidated Report
  const fetchConsolidatedReport = async (
    tData: PageTransparencyData | null,
    wUrl: string
  ) => {
    if (reportAbortRef.current) {
      reportAbortRef.current.abort();
    }
    const controller = new AbortController();
    reportAbortRef.current = controller;

    setReportLoading(true);
    try {
      const json = await api.fetchSellerHistoryReport({
        transparency_data: tData,
        website_url: wUrl || null,
      }, { signal: controller.signal });
      setReport(json);
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
        return;
      }
      console.error('Error fetching consolidated report:', err);
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
    <div className="space-y-8">
      {/* Workflow Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-sans">
                বিক্রেতার ইতিহাস ও পেজ ট্রান্সপারেন্সি (Seller History Intelligence)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                ফেসবুক পেজ ট্রান্সপারেন্সি ও ইন্টারনেট আর্কাইভ (Wayback Machine) থেকে যাচাইযোগ্য বাস্তব তথ্য অনুসন্ধান
              </p>
            </div>
          </div>

          {(transparencyFile || websiteUrl || report) && (
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট করুন</span>
            </button>
          )}
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
            <Shield className="w-3 h-3" />
            <span>প্রমাণভিত্তিক নীতি: জিরো ফেক স্কোর • স্বাধীন আর্কাইভ প্রমাণ</span>
          </span>
        </div>
      </div>

      {/* Dual Input Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Facebook Page Transparency */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Facebook Page Transparency</h3>
                  <p className="text-xs text-slate-400">পেজের About &gt; Page Transparency এর স্ক্রিনশট</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                Gemini OCR
              </span>
            </div>

            {/* Upload Dropzone / Preview */}
            {!transparencyPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 min-h-[44px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  ট্রান্সপারেন্সি স্ক্রিনশট নির্বাচন করতে ক্লিক করুন
                </p>
                <p className="text-[11px] text-slate-500 mt-1">PNG, JPEG, WebP (সর্বোচ্চ ৫ মেগাবাইট)</p>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  🛡️ মেমরিতে প্রসেস করে মেটাডাটা মুছে ফেলা হয়; ডিস্কে জমা রাখা হয় না।
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={transparencyPreview}
                      alt="Transparency Screenshot"
                      className="w-14 h-16 object-cover rounded-lg border border-slate-800"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[200px]">
                        {transparencyFile?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {((transparencyFile?.size || 0) / 1024).toFixed(1)} KB
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        স্ক্রিনশট প্রস্তুত
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="স্ক্রিনশট বাতিল করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {transparencyError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transparencyError}</span>
              </div>
            )}

            {/* Extracted Data Review & Correction */}
            {transparencyData && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300 font-sans">OCR এক্সট্রাকশন রিভিউ (সংশোধনযোগ্য)</span>
                  <span className="text-[10px] text-amber-400 font-mono">USER_PROVIDED_UNVERIFIED</span>
                </div>

                {transparencyData.timeline_consistency_status === 'NEEDS_REVIEW' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold text-amber-200">টাইমলাইন অসঙ্গতি সতর্কতা (Needs Review):</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-300">
                        {transparencyData.timeline_conflicts?.map((conflict, cIdx) => (
                          <li key={cIdx}>{conflict}</li>
                        ))}
                      </ul>
                      <p className="mt-1 text-[10px] text-amber-400/80 italic">
                        স্ক্রিনশটে তারিখের অসঙ্গতি থাকতে পারে। অর্ডার করার পূর্বে ফেসবুক পেজের মূল About সেকশন সরাসরি যাচাই করুন।
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">পেজের নাম</label>
                    <input
                      type="text"
                      value={editPageName}
                      onChange={(e) => setEditPageName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">পেজ তৈরির তারিখ</label>
                    <input
                      type="text"
                      value={editCreationDate}
                      onChange={(e) => setEditCreationDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-medium font-mono"
                    />
                  </div>
                </div>

                {transparencyData.name_changes && transparencyData.name_changes.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] text-slate-400 font-medium mb-1">
                      পূর্বের নাম পরিবর্তনের ইতিহাস ({transparencyData.name_changes.length} বার):
                    </p>
                    <div className="space-y-1">
                      {transparencyData.name_changes.map((nc, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded">
                          <span className="font-semibold text-amber-300">{nc.previous_name}</span>
                          <span className="text-slate-500 font-mono">{nc.change_date || 'তারিখ দৃশ্যমান নয়'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {transparencyData.manager_locations && transparencyData.manager_locations.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-300 flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>ম্যানেজমেন্ট লোকেশন: </span>
                    <span className="font-semibold text-slate-200">
                      {transparencyData.manager_locations.map(l => `${l.country}${l.count ? ` (${l.count})` : ''}`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyzeTransparency}
            disabled={!transparencyFile || transparencyLoading}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg min-h-[44px] ${
              !transparencyFile || transparencyLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {transparencyLoading ? (
              <span>ট্রান্সপারেন্সি বিশ্লেষণ হচ্ছে...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ট্রান্সপারেন্সি ডাটা বিশ্লেষণ করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Website Wayback Machine Research */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Website Historical Research</h3>
                  <p className="text-xs text-slate-400">Internet Archive (Wayback Machine CDX API)</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                Wayback CDX
              </span>
            </div>

            <form onSubmit={handleResearchWebsite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  অনলাইন শপ ওয়েবসাইট লিঙ্ক (SSRF সুরক্ষিত)
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://daraz.com.bd অথবা chaldal.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">নমুনা লিঙ্ক:</span>
                  {['https://daraz.com.bd', 'https://chaldal.com', 'https://rokomari.com'].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setWebsiteUrl(url)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors font-mono"
                    >
                      {url.replace('https://', '')}
                    </button>
                  ))}
                </div>
              </div>

              {websiteError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{websiteError}</span>
                </div>
              )}

              {/* Website Results Card */}
              {websiteData && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px] font-mono">
                      ডোমেইন: {websiteData.cleaned_domain}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      websiteData.archive_available
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {websiteData.archive_available
                        ? `${websiteData.sample_snapshots_count || websiteData.total_snapshots_observed} নমুনা`
                        : 'আর্কাইভ নেই'}
                    </span>
                  </div>

                  {websiteData.archive_available && websiteData.earliest_snapshot ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-400" />
                          <span>প্রথম আর্কাইভ রেকর্ড:</span>
                        </span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {websiteData.earliest_snapshot.formatted_date}
                        </span>
                      </div>

                      {websiteData.latest_snapshot && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span>সর্বশেষ স্ন্যাপশট:</span>
                          </span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {websiteData.latest_snapshot.formatted_date}
                          </span>
                        </div>
                      )}

                      <div className="pt-2">
                        <p className="text-[11px] text-slate-400 font-medium mb-1.5">যাচাইযোগ্য আর্কাইভ স্ন্যাপশট লিঙ্কসমূহ:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {websiteData.sample_snapshots.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.snapshot_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-teal-400 hover:text-teal-300 border border-slate-700 transition-colors font-mono"
                            >
                              <span>{s.formatted_date}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      ইন্টারনেট আর্কাইভে এই ওয়েবসাইটের কোনো সংরক্ষিত রেকর্ড নেই।
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                    ℹ️ প্রথম আর্কাইভ তারিখ ডোমেইন খোলার বা ব্যবসা প্রতিষ্ঠার প্রমাণ নয়।
                  </div>
                </div>
              )}
            </form>
          </div>

          <button
            onClick={() => handleResearchWebsite()}
            disabled={!websiteUrl.trim() || websiteLoading}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg min-h-[44px] ${
              !websiteUrl.trim() || websiteLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20'
            }`}
          >
            {websiteLoading ? (
              <span>আর্কাইভ অনুসন্ধান হচ্ছে...</span>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>ওয়েবসাইট ইতিহাস অনুসন্ধান করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading indicator for report */}
      {reportLoading && (
        <LoadingState
          title="সেলার হিস্ট্রি রিপোর্ট সংকলন করা হচ্ছে..."
          message="ফেসবুক পেজ ও আর্কাইভ তথ্যের পারস্পরিক যাচাই সম্পন্ন করা হচ্ছে..."
        />
      )}

      {/* Consolidated Structured Evidence Report */}
      {report && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white font-sans">
                  বিক্রেতার প্রমাণভিত্তিক হিস্ট্রি রিপোর্ট (Consolidated Report)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {report.overall_summary}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 font-medium">
                জিরো ফেক ট্রাস্ট স্কোর
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-medium">
                বাস্তব প্রমাণভিত্তিক
              </span>
            </div>
          </div>

          {/* Findings Categorized by Provenance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category 1: Independently Retrieved Web Evidence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-teal-900/30 space-y-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-teal-300 font-sans">ইন্ডিপেন্ডেন্ট ওয়েব প্রমাণ</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                ইন্টারনেট আর্কাইভ ও পাবলিক রেজিস্ট্রি থেকে সংগৃহীত স্বাধীন রেকর্ড।
              </p>
              <div className="space-y-3">
                {report.independently_retrieved && report.independently_retrieved.length > 0 ? (
                  report.independently_retrieved.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <p className="font-semibold text-slate-200">{f.field_label}</p>
                      <p className="text-teal-400 font-mono mt-0.5">{String(f.observed_value)}</p>
                      {f.source_url && (
                        <a
                          href={f.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] text-blue-400 hover:underline mt-1 font-mono"
                        >
                          <span>স্ন্যাপশট দেখুন</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 italic">{f.limitations}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">কোনো স্বাধীন ওয়েবসাইট রেকর্ড সংযুক্ত নেই।</p>
                )}
              </div>
            </div>

            {/* Category 2: User-Provided Screenshot Evidence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-900/30 space-y-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-300 font-sans">ইউজার স্ক্রিনশট প্রমাণ</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                আপলোডকৃত স্ক্রিনশট থেকে দৃশ্যমান তথ্য (মেটার সাথে আনভেরিফাইড)।
              </p>
              <div className="space-y-3">
                {report.user_provided_screenshots && report.user_provided_screenshots.length > 0 ? (
                  report.user_provided_screenshots.map((f, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg border text-xs ${
                      f.verification_status === 'NEEDS_REVIEW'
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-200">{f.field_label}</p>
                        {f.verification_status === 'NEEDS_REVIEW' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center space-x-1">
                            <span>Needs Review</span>
                          </span>
                        )}
                      </div>
                      <p className={`font-mono mt-0.5 ${
                        f.verification_status === 'NEEDS_REVIEW' ? 'text-amber-200 font-semibold' : 'text-amber-300'
                      }`}>{String(f.observed_value)}</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">{f.limitations}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">কোনো পেজ ট্রান্সপারেন্সি স্ক্রিনশট দেওয়া হয়নি।</p>
                )}
              </div>
            </div>

            {/* Category 3: Unverified or Unavailable Information */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <FileQuestion className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-300 font-sans">অনুপস্থিত বা অপর্যাপ্ত তথ্য</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                যেসব ট্রাস্ট মার্কার স্ক্রিনশটে দৃশ্যমান নয় বা লিঙ্ক দেওয়া হয়নি।
              </p>
              <div className="space-y-3">
                {report.unverified_or_unavailable && report.unverified_or_unavailable.map((f, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-300">{f.field_label}</p>
                    <p className="text-slate-500 font-mono mt-0.5">{String(f.observed_value)}</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">{f.limitations}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buyer Verification Questions */}
          {report.buyer_verification_questions && report.buyer_verification_questions.length > 0 && (
            <BuyerQuestionsCard
              questions={report.buyer_verification_questions}
              title="বিক্রেতার ইতিহাস সংক্রান্ত বাস্তব যাচাইকারী প্রশ্ন"
              description="অর্ডার চূড়ান্ত বা কোনো অগ্রিম মূল্য পরিশোধের পূর্বে বিক্রেতাকে নিচের প্রশ্নগুলো ইনবক্সে পাঠান:"
            />
          )}

          {/* Disclaimer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-500">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{report.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
