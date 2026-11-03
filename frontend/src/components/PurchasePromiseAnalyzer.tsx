import React, { useState, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

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

interface SingleClaim {
  claim_type: string;
  normalized_value: string | null;
  original_evidence: string | null;
  source_type: string;
  is_supported: boolean;
}

interface ComparisonItem {
  field: string;
  field_label: string;
  status: 'CONTRADICTION' | 'CONSISTENT' | 'INSUFFICIENT_INFORMATION' | 'NEEDS_REVIEW';
  ad_evidence: string | null;
  chat_evidence: string | null;
  explanation: string;
  severity: string;
}

interface PaymentWarning {
  type: string;
  severity: string;
  supporting_evidence: string | null;
  explanation: string;
  suggested_buyer_action: string;
}

interface MissingInfoItem {
  field: string;
  field_label: string;
  description: string;
  importance: string;
}

interface ExtractedClaims {
  source_type: string;
  product_name: string | null;
  price: number | null;
  currency: string | null;
  price_evidence: string | null;
  cod_available: boolean | null;
  cod_evidence: string | null;
  advance_payment_required: boolean | null;
  advance_payment_amount: number | null;
  advance_payment_purpose: string | null;
  advance_payment_evidence: string | null;
  payment_methods: string[];
  payment_methods_evidence: string | null;
  return_policy_available: boolean | null;
  return_policy_terms: string | null;
  return_policy_evidence: string | null;
  warranty_available: boolean | null;
  warranty_terms: string | null;
  warranty_evidence: string | null;
  delivery_conditions: string | null;
  delivery_evidence: string | null;
  urgency_or_pressure: string | null;
  urgency_evidence: string | null;
  claims_list: SingleClaim[];
  unsupported_claims: SingleClaim[];
}

interface AnalyzeResponse {
  status: string;
  has_contradictions: boolean;
  contradiction_count: number;
  needs_review_count: number;
  advertisement_claims: ExtractedClaims;
  seller_chat_claims: ExtractedClaims;
  comparison_results: ComparisonItem[];
  payment_warnings: PaymentWarning[];
  missing_information: MissingInfoItem[];
  buyer_questions_bangla: string[];
  metadata: {
    model_used: string | null;
    ad_char_count: number;
    chat_char_count: number;
    execution_time_ms: number | null;
  };
}

// Pre-packaged test scenarios for Bangladeshi online shopping (clearly marked as fictional)
const SAMPLE_SCENARIOS = [
  {
    title: 'Scenario 1: Price & COD Contradiction (Bangla)',
    ad: `স্মার্ট ওয়াচ প্রো ম্যাক্স! আকর্ষণীয় অফার মূল্য মাত্র ১২০০ টাকা। 
সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। 
৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি এবং ১ বছরের সার্ভিস ওয়ারেন্টি।`,
    chat: `হ্যালো ভাইয়া, ওয়াচটির বর্তমান দাম ১৫০০ টাকা। 
ঢাকার বাইরে ক্যাশ অন ডেলিভারি দেওয়া যাবে না। সম্পূর্ণ ১৫০০ টাকা আগে বিকাশ এ সেন্ড মানি করতে হবে। 
অর্ডার কনফার্ম করতে দ্রুত টাকা পাঠান, অফার শেষ হয়ে যাবে।`,
  },
  {
    title: 'Scenario 2: Normal Advance Delivery Fee (Banglish)',
    ad: `Wireless Bluetooth Headphone with Deep Bass! 
Special Price: 2,500 BDT. Cash on Delivery available. 
Original 1 Year Official Brand Warranty. 7 days checking warranty.`,
    chat: `Hello, price is 2500 taka. Delivery charge 150 taka advance bkash korte hobe to confirm parcel booking. 
Baki 2500 taka delivery er shomoy courier er kache COD te diben. 1 year warranty card thakbe.`,
  },
  {
    title: 'Scenario 3: Return Policy & Warranty Denial',
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
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);

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
        error: 'Unsupported image format. Please upload a PNG, JPEG, or WebP screenshot.',
        loading: false,
      }));
      return;
    }

    // Client-side file size limit: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setScreenshot((prev) => ({
        ...prev,
        error: 'Screenshot exceeds 5 MB size limit. Please upload a smaller image.',
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

    // Revoke previous preview URL if present
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

    // Clear previous comparison results since new input is arriving
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/extract-screenshot`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) {
          throw new Error(
            errorData.detail ||
              'Gemini API key is not configured on the backend server. Configure GEMINI_API_KEY to enable live screenshot OCR.'
          );
        } else if (response.status === 413) {
          throw new Error('Screenshot exceeds 5 MB size limit.');
        } else if (response.status === 429) {
          throw new Error('AI OCR rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 504) {
          throw new Error('Screenshot OCR request timed out. Please try with a clearer or smaller image.');
        } else if (response.status === 502) {
          throw new Error('The AI OCR service is currently unavailable. Please try again.');
        } else {
          throw new Error(errorData.detail || `OCR failed (${response.status}). Could not extract text.`);
        }
      }

      const data = await response.json();
      const extracted = data.extracted_text || '';

      if (isAd) {
        setAdText(extracted);
      } else {
        setChatText(extracted);
      }

      setScreenshot((prev) => ({
        ...prev,
        loading: false,
        error: extracted ? null : 'No visible text recognized in the screenshot. You can type or paste the text directly.',
        success: Boolean(extracted),
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return; // Request was aborted by user
        }
        setScreenshot((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
          success: false,
        }));
      } else {
        setScreenshot((prev) => ({
          ...prev,
          loading: false,
          error: 'An unexpected error occurred during OCR extraction.',
          success: false,
        }));
      }
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

  const handleAnalyze = async () => {
    const adClean = adText.trim();
    const chatClean = chatText.trim();

    if (adClean.length < 5 || chatClean.length < 5) {
      setError('Please provide at least 5 characters for both the advertisement and the conversation text.');
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

    // Client-side safety timeout after 35s
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, 35000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertisement_text: adClean,
          seller_chat_text: chatClean,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      // Discard response if a newer request was dispatched in the meantime
      if (requestId !== currentRequestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) {
          throw new Error(
            errorData.detail ||
              'Gemini API key is not configured on the backend server. Configure GEMINI_API_KEY in the backend .env file to enable live AI extraction.'
          );
        } else if (response.status === 429) {
          throw new Error(
            errorData.detail || 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.'
          );
        } else if (response.status === 504) {
          throw new Error(
            errorData.detail || 'The AI extraction timed out. Please try again with shorter text.'
          );
        } else if (response.status === 502) {
          throw new Error(
            errorData.detail || 'The AI service provider returned an error. Please try again.'
          );
        } else {
          throw new Error(errorData.detail || `Server error (${response.status}): Could not complete analysis.`);
        }
      }

      const data: AnalyzeResponse = await response.json();
      if (requestId === currentRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          if (requestId === currentRequestIdRef.current) {
            setError('The analysis request timed out or was cancelled. Please check your connection and try again.');
          }
          return;
        }
        if (requestId === currentRequestIdRef.current) {
          setError(err.message);
        }
      } else {
        if (requestId === currentRequestIdRef.current) {
          setError('An unexpected error occurred while communicating with the analysis server.');
        }
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const copyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const allUnsupported = results
    ? [...results.advertisement_claims.unsupported_claims, ...results.seller_chat_claims.unsupported_claims]
    : [];

  return (
    <section id="analyzer" className="py-16 md:py-24 border-t border-slate-800 bg-[#060b16] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Purchase Promise & Contradiction Analyzer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Compare Ad Promises vs. Chat Conversations
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Paste the seller&apos;s public post and your private chat messages. ShopShield BD extracts explicit
            commitments, highlights factual contradictions, evaluates payment safety, and prepares verification
            questions in simple Bangla.
          </p>
          <div className="mt-3 inline-flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded-md border border-slate-800">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero fake scores. Factual comparison of price, COD, advance payments, and warranty.</span>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="mb-6">
          <div className="text-center mb-2">
            <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/40 inline-flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 text-amber-400" />
              Note: Sample scenarios are fictional simulations for testing contradiction detection and safety rules.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-400 mr-2 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Load Sample Scenario:
            </span>
            {SAMPLE_SCENARIOS.map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => loadScenario(idx)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 transition-all"
              >
                {scenario.title}
              </button>
            ))}
            <button
              onClick={() => {
                if (abortControllerRef.current) abortControllerRef.current.abort();
                handleRemoveScreenshot('advertisement');
                handleRemoveScreenshot('seller_chat');
                setAdText('');
                setChatText('');
                setResults(null);
                setError(null);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 transition-colors"
            >
              Clear Inputs
            </button>
          </div>
        </div>

        {/* Privacy & Screenshot Safety Notice */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-xs flex items-start space-x-3 max-w-5xl mx-auto shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block text-xs sm:text-sm">
              🔒 Privacy & Screenshot Safety Advisory
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              Screenshots are transmitted securely to Google Gemini OCR for in-memory optical character recognition and are{' '}
              <strong className="text-emerald-400 font-medium">never permanently stored or logged</strong> on our servers.
              For your safety, we strongly recommend cropping or concealing personal phone numbers, physical addresses,
              and private bKash/Nagad wallet numbers before uploading. Extracted text remains 100% editable so you can
              review and correct any details before running the promise audit.
            </p>
          </div>
        </div>

        {/* Dual Input Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Advertisement Input Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4" />
                  <span>1. Seller Advertisement / Public Post</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">{adText.length} characters</span>
              </div>

              {/* Advertisement Screenshot Upload Control */}
              <div className="mb-3">
                {!adScreenshot.file ? (
                  <div
                    onClick={() => adFileInputRef.current?.click()}
                    className="group relative border border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-3 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex items-center justify-between"
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
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          Upload Advertisement Screenshot
                        </div>
                        <div className="text-[11px] text-slate-500">
                          PNG, JPEG, WebP (Max 5 MB) • Auto-extracts via Gemini OCR
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-400/90 group-hover:text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50 shrink-0 ml-2">
                      Browse Image
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
                          alt="Advertisement screenshot"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700/80 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center space-x-1.5">
                          <span className="truncate">{adScreenshot.file.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            ({(adScreenshot.file.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                        {adScreenshot.loading ? (
                          <div className="text-[11px] text-amber-400 flex items-center space-x-1 pt-0.5">
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                            <span>Extracting visible text via Gemini OCR...</span>
                          </div>
                        ) : adScreenshot.error ? (
                          <div className="text-[11px] text-rose-400 truncate pt-0.5">{adScreenshot.error}</div>
                        ) : (
                          <div className="text-[11px] text-emerald-400 flex items-center space-x-1 pt-0.5">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>OCR Extracted • Review and correct text below</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => adFileInputRef.current?.click()}
                        disabled={adScreenshot.loading}
                        className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot('advertisement')}
                        className="text-[11px] p-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Remove Screenshot"
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
                placeholder="Paste the seller's Facebook page caption, post text, or upload an ad screenshot above..."
                rows={8}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-sans leading-relaxed resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Supports Bangla, English, and Banglish (e.g., &quot;dam 1200 taka, free delivery&quot;).
            </p>
          </div>

          {/* Seller Chat Input Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Seller Chat / Messenger Conversation</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">{chatText.length} characters</span>
              </div>

              {/* Seller Chat Screenshot Upload Control */}
              <div className="mb-3">
                {!chatScreenshot.file ? (
                  <div
                    onClick={() => chatFileInputRef.current?.click()}
                    className="group relative border border-dashed border-slate-700/80 hover:border-teal-500/60 rounded-xl p-3 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex items-center justify-between"
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
                          Upload Chat / Messenger Screenshot
                        </div>
                        <div className="text-[11px] text-slate-500">
                          PNG, JPEG, WebP (Max 5 MB) • Auto-extracts via Gemini OCR
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-teal-400/90 group-hover:text-teal-300 bg-teal-950/40 px-2 py-1 rounded border border-teal-900/50 shrink-0 ml-2">
                      Browse Image
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
                          alt="Conversation screenshot"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700/80 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center space-x-1.5">
                          <span className="truncate">{chatScreenshot.file.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            ({(chatScreenshot.file.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                        {chatScreenshot.loading ? (
                          <div className="text-[11px] text-amber-400 flex items-center space-x-1 pt-0.5">
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                            <span>Extracting visible text via Gemini OCR...</span>
                          </div>
                        ) : chatScreenshot.error ? (
                          <div className="text-[11px] text-rose-400 truncate pt-0.5">{chatScreenshot.error}</div>
                        ) : (
                          <div className="text-[11px] text-teal-400 flex items-center space-x-1 pt-0.5">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>OCR Extracted • Review and correct text below</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => chatFileInputRef.current?.click()}
                        disabled={chatScreenshot.loading}
                        className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot('seller_chat')}
                        className="text-[11px] p-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Remove Screenshot"
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
                placeholder="Paste the direct conversation from Messenger, WhatsApp, or upload a chat screenshot above..."
                rows={8}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-sans leading-relaxed resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Include quotes regarding price quotes, payment numbers, delivery terms, and warranties.
            </p>
          </div>
        </div>

        {/* Analyze Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Promises & Analyzing Contradictions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Purchase Promise Audit</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-8 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">Analysis Notice</strong>
              <p className="text-slate-300 leading-relaxed">{error}</p>
              {error.includes('GEMINI_API_KEY') && (
                <p className="text-slate-400 font-mono text-xs pt-1">
                  Tip: Copy <code>.env.example</code> to <code>.env</code> in the project root and add your{' '}
                  <code>GEMINI_API_KEY</code>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="mt-12 space-y-8 animate-fadeIn">
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
                  <h3 className="text-lg font-bold text-white">
                    {results.has_contradictions
                      ? `Contradictions Detected (${results.contradiction_count})`
                      : 'Promises Consistent Across Both Sources'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {results.has_contradictions
                      ? 'The seller chat conflicts with claims published in the public advertisement.'
                      : 'The commercial terms offered in chat match the published advertisement commitments.'}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {results.contradiction_count > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold">
                    {results.contradiction_count} Conflicts
                  </span>
                )}
                {results.needs_review_count > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {results.needs_review_count} Need Review
                  </span>
                )}
                {results.metadata.execution_time_ms && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                    {results.metadata.execution_time_ms} ms
                  </span>
                )}
              </div>
            </div>

            {/* Unsupported / Fabricated Quotes Warning (if any was caught by validator) */}
            {allUnsupported.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 text-xs">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Evidence Verification Notice</span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-2">
                  ShopShield BD&apos;s anti-hallucination engine detected claims where verbatim supporting quotes
                  could not be verified in the input text. To protect analysis integrity, these values were discarded
                  from contradiction detection:
                </p>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  {allUnsupported.map((u, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <strong className="text-amber-300">[{u.source_type} : {u.claim_type}]</strong> {u.normalized_value}
                      {u.original_evidence ? ` — Quote not found: "${u.original_evidence}"` : ' — No evidence quotation provided'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Cards Grid */}
            <div>
              <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Side-by-Side Promise Cross-Reference</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.comparison_results.map((item, idx) => {
                  const statusColors = {
                    CONTRADICTION: 'border-rose-800/80 bg-rose-950/20 text-rose-400',
                    CONSISTENT: 'border-emerald-800/60 bg-emerald-950/15 text-emerald-400',
                    NEEDS_REVIEW: 'border-amber-800/60 bg-amber-950/15 text-amber-400',
                    INSUFFICIENT_INFORMATION: 'border-slate-800 bg-slate-950/50 text-slate-400',
                  };

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-white">{item.field_label}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                              statusColors[item.status]
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mb-4 leading-relaxed">{item.explanation}</p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                        {item.ad_evidence && (
                          <div className="p-2 rounded bg-slate-950 text-slate-300">
                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Ad Quote:</span>
                            &ldquo;{item.ad_evidence}&rdquo;
                          </div>
                        )}
                        {item.chat_evidence && (
                          <div className="p-2 rounded bg-slate-950 text-slate-300">
                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Chat Quote:</span>
                            &ldquo;{item.chat_evidence}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Safety Findings */}
            {results.payment_warnings.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Payment Safety Findings & Recommendations</span>
                </h3>

                <div className="space-y-3">
                  {results.payment_warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        w.severity === 'warning'
                          ? 'bg-rose-950/20 border-rose-800/60'
                          : w.severity === 'caution'
                          ? 'bg-amber-950/20 border-amber-800/60'
                          : 'bg-emerald-950/20 border-emerald-800/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertTriangle
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            w.severity === 'warning'
                              ? 'text-rose-400'
                              : w.severity === 'caution'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        />
                        <div className="space-y-2 text-xs">
                          <p className="text-slate-200 leading-relaxed font-normal">{w.explanation}</p>
                          {w.supporting_evidence && (
                            <p className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded">
                              Evidence: &ldquo;{w.supporting_evidence}&rdquo;
                            </p>
                          )}
                          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 text-emerald-300">
                            <strong className="block text-slate-300 font-semibold mb-0.5">ক্রেতার জন্য করণীয়:</strong>
                            {w.suggested_buyer_action}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Information Alerts */}
            {results.missing_information.length > 0 && (
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Missing Commercial Terms (Unspecified in Both Sources)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {results.missing_information.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <strong className="text-slate-200 block mb-1">{m.field_label}</strong>
                      <span className="text-slate-400">{m.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buyer Verification Questions (Bangla) */}
            {results.buyer_questions_bangla.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-800/50">
                <div className="flex items-center space-x-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    ক্রেতার জন্য যাচাইকারী প্রশ্নমালা (পেমেন্ট করার আগে চ্যাটে জেনে নিন)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  নিচের প্রশ্নগুলো সরাসরি কপি করে বিক্রেতার মেসেঞ্জারে পাঠিয়ে দিন, যাতে পেমেন্ট করার আগেই প্রতিশ্রুতি লিখিত থাকে:
                </p>

                <div className="space-y-2">
                  {results.buyer_questions_bangla.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-slate-200 font-medium">{q}</span>
                      <button
                        onClick={() => copyQuestion(q, idx)}
                        className="ml-3 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-colors shrink-0 flex items-center space-x-1 text-xs"
                        title="Copy question"
                      >
                        {copiedQuestionIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
