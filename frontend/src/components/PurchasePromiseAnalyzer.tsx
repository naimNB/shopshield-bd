import React, { useState, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Upload,
  X,
  RotateCcw,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  AnalyzeResponse,
  SingleClaim,
  ComparisonItem,
  MissingInfoItem,
} from '../types/api';
import { BuyerQuestionsCard } from './shared/BuyerQuestionsCard';
import { PaymentWarningsCard } from './shared/PaymentWarningsCard';
import { LoadingState, ErrorState } from './shared/StatusState';

interface ScreenshotState {
  file: File | null;
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialScreenshotState: ScreenshotState = {
  file: null,
  previewUrl: null,
  loading: false,
  error: null,
  success: false,
};

// Pre-packaged test scenarios for Bangladeshi online shopping (clearly marked as fictional simulations)
const SAMPLE_SCENARIOS = [
  {
    title: '১. মূল্য ও সিওডি গরমিল (Bangla)',
    ad: `স্মার্ট ওয়াচ প্রো ম্যাক্স! আকর্ষণীয় অফার মূল্য মাত্র ১২০০ টাকা। 
সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। 
৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি এবং ১ বছরের সার্ভিস ওয়ারেন্টি।`,
    chat: `হ্যালো ভাইয়া, ওয়াচটির বর্তমান দাম ১৫০০ টাকা। 
ঢাকার বাইরে ক্যাশ অন ডেলিভারি দেওয়া যাবে না। সম্পূর্ণ ১৫০০ টাকা আগে বিকাশ এ সেন্ড মানি করতে হবে। 
অর্ডার কনফার্ম করতে দ্রুত টাকা পাঠান, অফার শেষ হয়ে যাবে।`,
  },
  {
    title: '২. স্বাভাবিক অগ্রিম ডেলিভারি চার্জ (Banglish)',
    ad: `Wireless Bluetooth Headphone with Deep Bass! 
Special Price: 2,500 BDT. Cash on Delivery available across Bangladesh. 
Original 1 Year Official Brand Warranty. 7 days checking warranty.`,
    chat: `Hello, price is 2500 taka. Delivery charge 150 taka advance bkash korte hobe to confirm parcel booking. 
Baki 2500 taka delivery er shomoy courier er kache COD te diben. 1 year warranty card thakbe.`,
  },
  {
    title: '৩. রিটার্ন পলিসি ও ওয়ারেন্টি অস্বীকার (Banglish)',
    ad: `Premium Cotton Punjabi collection. Export Quality. 
Price 1,850 Tk. Cash on Delivery available across BD. 
7 Days Easy Return & Size Replacement Guarantee if defect found.`,
    chat: `Salam, 1850 taka price thik ache. But size check kore niben, 
bikri hoye gele kono return ba replacement hobe na. Ekdom fixed, kono warranty nei.`,
  },
];

export const PurchasePromiseAnalyzer: React.FC = () => {
  const [adText, setAdText] = useState(SAMPLE_SCENARIOS[0].ad);
  const [chatText, setChatText] = useState(SAMPLE_SCENARIOS[0].chat);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);

  // Screenshot upload states
  const [adScreenshot, setAdScreenshot] = useState<ScreenshotState>(initialScreenshotState);
  const [chatScreenshot, setChatScreenshot] = useState<ScreenshotState>(initialScreenshotState);

  // Hidden file input refs
  const adFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  // Per-slot OCR abort controller refs
  const adOcrAbortRef = useRef<AbortController | null>(null);
  const chatOcrAbortRef = useRef<AbortController | null>(null);

  // Request race condition protection for analyze
  const currentRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleScreenshotUpload = async (
    file: File,
    sourceType: 'advertisement' | 'seller_chat'
  ) => {
    const isAd = sourceType === 'advertisement';
    const setScreenshot = isAd ? setAdScreenshot : setChatScreenshot;
    const abortRef = isAd ? adOcrAbortRef : chatOcrAbortRef;

    // Client-side format validation
    const validMimes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setScreenshot((prev) => ({
        ...prev,
        error: 'PNG, JPEG বা WebP ফরম্যাটের স্ক্রিনশট আপলোড করুন।',
        loading: false,
      }));
      return;
    }

    // Client-side file size limit: 5 MB (matching backend)
    if (file.size > 5 * 1024 * 1024) {
      setScreenshot((prev) => ({
        ...prev,
        error: 'ফাইলের সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না। অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।',
        loading: false,
      }));
      return;
    }

    // Cancel in-flight OCR request for this slot if any
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Set preview URL
    setScreenshot((prev) => {
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        loading: true,
        error: null,
        success: false,
      };
    });

    setResults(null);
    setError(null);

    try {
      const data = await api.extractScreenshot(file);
      const extracted = data.extracted_text || '';

      if (isAd) {
        setAdText(extracted);
      } else {
        setChatText(extracted);
      }

      setScreenshot((prev) => ({
        ...prev,
        loading: false,
        error: extracted ? null : 'স্ক্রিনশট থেকে কোনো লেখা পাওয়া যায়নি। আপনি নিচে সরাসরি টাইপ বা পেস্ট করতে পারেন।',
        success: Boolean(extracted),
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'স্ক্রিনশট প্রসেস করার সময় একটি ত্রুটি ঘটেছে।';
      setScreenshot((prev) => ({
        ...prev,
        loading: false,
        error: msg,
        success: false,
      }));
    }
  };

  const handleRemoveScreenshot = (sourceType: 'advertisement' | 'seller_chat') => {
    const isAd = sourceType === 'advertisement';
    const setScreenshot = isAd ? setAdScreenshot : setChatScreenshot;
    const abortRef = isAd ? adOcrAbortRef : chatOcrAbortRef;
    const fileInputRef = isAd ? adFileInputRef : chatFileInputRef;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setScreenshot((prev) => {
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return initialScreenshotState;
    });
  };

  const handleAdTextChange = (value: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAdText(value);
    setResults(null);
    setError(null);
  };

  const handleChatTextChange = (value: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setChatText(value);
    setResults(null);
    setError(null);
  };

  const loadScenario = (index: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    handleRemoveScreenshot('advertisement');
    handleRemoveScreenshot('seller_chat');
    setAdText(SAMPLE_SCENARIOS[index].ad);
    setChatText(SAMPLE_SCENARIOS[index].chat);
    setResults(null);
    setError(null);
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    handleRemoveScreenshot('advertisement');
    handleRemoveScreenshot('seller_chat');
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
    setResults(null);

    try {
      const data = await api.analyzeAdVsChat({
        advertisement_text: adClean,
        seller_chat_text: chatClean,
      });

      if (requestId === currentRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: unknown) {
      if (requestId === currentRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : 'প্রতিশ্রুতি যাচাই বিশ্লেষণ সম্পন্ন করা যায়নি।';
        setError(msg);
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const allUnsupported: SingleClaim[] = results
    ? [...(results.advertisement_claims?.unsupported_claims || []), ...(results.seller_chat_claims?.unsupported_claims || [])]
    : [];

  return (
    <div className="space-y-8">
      {/* Workflow Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-sans">
              বিজ্ঞাপন বনাম ইনবক্স চ্যাট যাচাই (Promise Contradiction Audit)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              পাবলিক বিজ্ঞাপনের অফার এবং মেসেঞ্জারে বিক্রেতার কথার মধ্যে গরমিল, শর্ত পরিবর্তন ও পেমেন্ট ঝুঁকি ধরুন
            </p>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>নমুনা সিনারিও:</span>
          </span>
          {SAMPLE_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(idx)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {scenario.title}
            </button>
          ))}
          {(adText || chatText) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>মুছুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-300 text-xs flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200 block text-xs sm:text-sm">
            গোপনীয়তা ও স্ক্রিনশট সুরক্ষা পরামর্শ
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
            স্ক্রিনশটগুলো শুধুমাত্র অপটিক্যাল ক্যারেক্টার রিকগনিশন (OCR) এর জন্য মেমরিতে প্রসেস করা হয় এবং সার্ভারে{' '}
            <strong className="text-teal-400 font-medium">কখনোই স্থায়ীভাবে সংরক্ষণ করা হয় না</strong>। সুরক্ষার স্বার্থে ব্যক্তিগত ফোন নম্বর বা ঠিকানা আপলোডের পূর্বে ক্রপ করে নিতে পারেন। এক্সট্রাক্ট করা টেক্সট আপনি সরাসরি নিচে সম্পাদনা করতে পারবেন।
          </p>
        </div>
      </div>

      {/* Dual Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advertisement Input Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>১. বিজ্ঞাপনের বর্ণনা বা পোস্টের টেক্সট</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{adText.length} অক্ষর</span>
            </div>

            {/* Ad Screenshot Upload Control */}
            <div className="mb-3">
              {!adScreenshot.file ? (
                <div
                  onClick={() => adFileInputRef.current?.click()}
                  className="group relative border border-dashed border-slate-700/80 hover:border-teal-500/60 rounded-xl p-3 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex items-center justify-between min-h-[44px]"
                >
                  <input
                    ref={adFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleScreenshotUpload(file, 'advertisement');
                    }}
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                        বিজ্ঞাপনের স্ক্রিনশট আপলোড করুন
                      </div>
                      <div className="text-[11px] text-slate-500">
                        PNG, JPEG, WebP (সর্বোচ্চ ৫ মেগাবাইট) • স্বয়ংক্রিয় OCR
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-teal-400 bg-teal-950/50 px-2 py-1 rounded border border-teal-900/60 shrink-0 ml-2">
                    ছবি নির্বাচন
                  </span>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/60 flex items-center justify-between">
                  <input
                    ref={adFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleScreenshotUpload(file, 'advertisement');
                    }}
                  />
                  <div className="flex items-center space-x-3 min-w-0">
                    {adScreenshot.previewUrl && (
                      <img
                        src={adScreenshot.previewUrl}
                        alt="বিজ্ঞাপনের স্ক্রিনশট"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate flex items-center space-x-1.5">
                        <span className="truncate">{adScreenshot.file?.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          ({((adScreenshot.file?.size || 0) / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      {adScreenshot.loading ? (
                        <div className="text-[11px] text-amber-400 flex items-center space-x-1 pt-0.5">
                          <span>লেখা এক্সট্রাক্ট করা হচ্ছে...</span>
                        </div>
                      ) : adScreenshot.error ? (
                        <div className="text-[11px] text-rose-400 truncate pt-0.5">{adScreenshot.error}</div>
                      ) : (
                        <div className="text-[11px] text-teal-400 flex items-center space-x-1 pt-0.5">
                          <span>OCR সম্পন্ন • নিচে যাচাই করে প্রয়োজনে সংশোধন করুন</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => adFileInputRef.current?.click()}
                      disabled={adScreenshot.loading}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors min-h-[32px]"
                    >
                      পরিবর্তন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot('advertisement')}
                      className="text-[11px] p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="স্ক্রিনশট মুছুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={adText}
              onChange={(e) => handleAdTextChange(e.target.value)}
              placeholder="ফেসবুক পেজের পোস্টের টেক্সট, বিজ্ঞাপনের ক্যাপশন অথবা পণ্যের বিবরণ এখানে পেস্ট করুন..."
              rows={8}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-sans leading-relaxed resize-y"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            বাংলা, ইংরেজি বা বাংলিশ (যেমন: &quot;dam 1200 taka, cash on delivery&quot;) সমর্থিত।
          </p>
        </div>

        {/* Seller Chat Input Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>২. বিক্রেতার ইনবক্স চ্যাট বা মেসেজ</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{chatText.length} অক্ষর</span>
            </div>

            {/* Chat Screenshot Upload Control */}
            <div className="mb-3">
              {!chatScreenshot.file ? (
                <div
                  onClick={() => chatFileInputRef.current?.click()}
                  className="group relative border border-dashed border-slate-700/80 hover:border-teal-500/60 rounded-xl p-3 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex items-center justify-between min-h-[44px]"
                >
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleScreenshotUpload(file, 'seller_chat');
                    }}
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                        ইনবক্স বা মেসেঞ্জার চ্যাটের স্ক্রিনশট আপলোড করুন
                      </div>
                      <div className="text-[11px] text-slate-500">
                        PNG, JPEG, WebP (সর্বোচ্চ ৫ মেগাবাইট) • স্বয়ংক্রিয় OCR
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-teal-400 bg-teal-950/50 px-2 py-1 rounded border border-teal-900/60 shrink-0 ml-2">
                    ছবি নির্বাচন
                  </span>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/60 flex items-center justify-between">
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleScreenshotUpload(file, 'seller_chat');
                    }}
                  />
                  <div className="flex items-center space-x-3 min-w-0">
                    {chatScreenshot.previewUrl && (
                      <img
                        src={chatScreenshot.previewUrl}
                        alt="চ্যাট স্ক্রিনশট"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate flex items-center space-x-1.5">
                        <span className="truncate">{chatScreenshot.file?.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          ({((chatScreenshot.file?.size || 0) / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      {chatScreenshot.loading ? (
                        <div className="text-[11px] text-amber-400 flex items-center space-x-1 pt-0.5">
                          <span>লেখা এক্সট্রাক্ট করা হচ্ছে...</span>
                        </div>
                      ) : chatScreenshot.error ? (
                        <div className="text-[11px] text-rose-400 truncate pt-0.5">{chatScreenshot.error}</div>
                      ) : (
                        <div className="text-[11px] text-teal-400 flex items-center space-x-1 pt-0.5">
                          <span>OCR সম্পন্ন • নিচে যাচাই করে প্রয়োজনে সংশোধন করুন</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={chatScreenshot.loading}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors min-h-[32px]"
                    >
                      পরিবর্তন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot('seller_chat')}
                      className="text-[11px] p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="স্ক্রিনশট মুছুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={chatText}
              onChange={(e) => handleChatTextChange(e.target.value)}
              placeholder="মেসেঞ্জার বা হোয়াটসঅ্যাপে বিক্রেতা যা বলেছেন (মূল্য, অগ্রিম টাকা চাওয়া, ওয়ারেন্টির শর্ত) এখানে পেস্ট করুন..."
              rows={8}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-sans leading-relaxed resize-y"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            বিক্রেতার দেওয়া বিকাশ/নগদ নম্বর এবং ডেলিভারির শর্তের অংশ অন্তর্ভুক্ত করুন।
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleAnalyze}
          disabled={loading || adText.trim().length < 5 || chatText.trim().length < 5}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Sparkles className="w-4 h-4" />
          <span>প্রতিশ্রুতির গরমিল ও ঝুঁকি বিশ্লেষণ করুন</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingState
          title="বিজ্ঞাপন ও ইনবক্স চ্যাটের প্রতিশ্রুতি তুলনা চলছে..."
          message="উভয় সোর্স থেকে প্রতিশ্রুত শর্তাবলি এক্সট্রাক্ট করে গরমিল ও পেমেন্ট ঝুঁকি বিশ্লেষণ করা হচ্ছে..."
          steps={[
            'বিজ্ঞাপন ও ইনবক্স চ্যাট থেকে পণ্য, মূল্য ও পেমেন্ট শর্ত বিশ্লেষণ...',
            'ক্যাশ অন ডেলিভারি, অগ্রিম চার্জ ও ওয়ারেন্টির শর্তের পারস্পরিক তুলনা...',
            'অগ্রিম অর্থ পরিশোধের ঝুঁকি ও ক্রেতার করণীয় যাচাইকারী প্রশ্নমালা তৈরি...',
          ]}
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={handleAnalyze} />
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Overview Banner */}
          <div
            className={`p-6 rounded-2xl border ${
              results.has_contradictions
                ? 'bg-rose-950/20 border-rose-800/50'
                : 'bg-emerald-950/20 border-emerald-800/50'
            } flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  results.has_contradictions
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {results.has_contradictions ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans">
                  {results.has_contradictions
                    ? `প্রতিশ্রুতির গরমিল সনাক্ত হয়েছে (${results.contradiction_count} টি)`
                    : 'বিজ্ঞাপন ও চ্যাটের তথ্যে কোনো গরমিল পাওয়া যায়নি'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {results.has_contradictions
                    ? 'পাবলিক বিজ্ঞাপনের অফারের সাথে ইনবক্সে বিক্রেতার বক্তব্যের অমিল রয়েছে।'
                    : 'বিজ্ঞাপনে উল্লেখিত বাণিজ্যিক শর্তাবলি এবং চ্যাটের বিবরণ পরস্পর সামঞ্জস্যপূর্ণ।'}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {results.contradiction_count > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                  {results.contradiction_count} টি গরমিল
                </span>
              )}
              {results.needs_review_count > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {results.needs_review_count} টি তথ্য পর্যালোচনা প্রয়োজন
                </span>
              )}
              {results.metadata?.execution_time_ms && (
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                  {results.metadata.execution_time_ms} ms
                </span>
              )}
            </div>
          </div>

          {/* Anti-Hallucination Quote Validator Notice */}
          {allUnsupported.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>প্রমাণ সত্যতা যাচাইকরণ বিজ্ঞপ্তি</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2">
                শপশিল্ড বিডির অ্যান্টি-হ্যালোসিনেশন ইঞ্জিন এমন কিছু দাবি সনাক্ত করেছে যা মূল টেক্সটে সুস্পষ্টভাবে পাওয়া যায়নি। বিশ্লেষণের নির্ভুলতা রক্ষার্থে সেগুলোকে গরমিল তালিকা থেকে বাদ দেওয়া হয়েছে:
              </p>
              <div className="space-y-1 font-mono text-[11px] text-slate-400">
                {allUnsupported.map((u, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800">
                    <strong className="text-amber-300">[{u.source_type} : {u.claim_type}]</strong> {u.normalized_value}
                    {u.original_evidence ? ` — মূল টেক্সটে অনুপস্থিত: "${u.original_evidence}"` : ' — কোনো প্রমাণ উদ্ধৃতি নেই'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-sans">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>শর্তভিত্তিক পাশাপাশি তুলনা (Promise Cross-Reference)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.comparison_results?.map((item: ComparisonItem, idx: number) => {
                const statusStyles = {
                  CONTRADICTION: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
                  CONSISTENT: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                  NEEDS_REVIEW: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
                  INSUFFICIENT_INFORMATION: 'border-slate-800 bg-slate-900/60 text-slate-400',
                };

                const statusLabels = {
                  CONTRADICTION: 'গরমিল (Contradiction)',
                  CONSISTENT: 'মিল রয়েছে (Consistent)',
                  NEEDS_REVIEW: 'পর্যালোচনা প্রয়োজন (Review)',
                  INSUFFICIENT_INFORMATION: 'অপ্রতুল তথ্য (Insufficient)',
                };

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white font-sans">{item.field_label}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                            statusStyles[item.status] || 'border-slate-800 text-slate-400'
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.explanation}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                      {item.ad_evidence && (
                        <div className="p-2.5 rounded bg-slate-950 text-slate-300">
                          <span className="text-teal-400 block text-[10px] uppercase font-sans font-semibold">বিজ্ঞাপনের বক্তব্য:</span>
                          &ldquo;{item.ad_evidence}&rdquo;
                        </div>
                      )}
                      {item.chat_evidence && (
                        <div className="p-2.5 rounded bg-slate-950 text-slate-300">
                          <span className="text-indigo-400 block text-[10px] uppercase font-sans font-semibold">চ্যাটের বক্তব্য:</span>
                          &ldquo;{item.chat_evidence}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Safety Warnings */}
          {results.payment_warnings && results.payment_warnings.length > 0 && (
            <PaymentWarningsCard
              warnings={results.payment_warnings}
              title="পেমেন্ট ও অগ্রিম পরিশোধ সংক্রান্ত ঝুঁকি ও সতর্কতা"
            />
          )}

          {/* Missing Commercial Terms */}
          {results.missing_information && results.missing_information.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-sans">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>অনুল্লেখিত বাণিজ্যিক শর্তাবলি (বিজ্ঞাপন বা চ্যাট কোথাও উল্লেখ নেই)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {results.missing_information.map((m: MissingInfoItem, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <strong className="text-slate-200 block mb-1 font-sans">{m.field_label}</strong>
                    <span className="text-slate-400 font-sans">{m.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Verification Questions */}
          {results.buyer_questions_bangla && results.buyer_questions_bangla.length > 0 && (
            <BuyerQuestionsCard
              questions={results.buyer_questions_bangla}
              title="ক্রেতার জন্য যাচাইকারী প্রশ্নমালা (পেমেন্ট করার আগে চ্যাটে জেনে নিন)"
              description="নিচের প্রশ্নগুলো সরাসরি কপি করে বিক্রেতার ইনবক্সে পাঠিয়ে দিন, যাতে পেমেন্ট করার আগেই প্রতিশ্রুতি লিখিত থাকে:"
            />
          )}
        </div>
      )}
    </div>
  );
};
