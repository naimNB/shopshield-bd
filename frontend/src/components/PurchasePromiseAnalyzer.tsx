import React, { useState } from 'react';
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
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

interface AnalyzeResponse {
  status: string;
  has_contradictions: boolean;
  contradiction_count: number;
  needs_review_count: number;
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

// Pre-packaged test scenarios for Bangladeshi online shopping
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

  const handleAnalyze = async () => {
    if (adText.trim().length < 5 || chatText.trim().length < 5) {
      setError('Please provide at least 5 characters for both the advertisement and the conversation text.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertisement_text: adText,
          seller_chat_text: chatText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) {
          throw new Error(
            errorData.detail ||
              'Gemini API key is not configured on the backend server. Set GEMINI_API_KEY in the backend .env file to enable live AI extraction.'
          );
        } else if (response.status === 502) {
          throw new Error(
            errorData.detail || 'The AI service provider failed to process the request. Please check quota or try again.'
          );
        } else {
          throw new Error(errorData.detail || `Server error (${response.status}): Could not complete analysis.`);
        }
      }

      const data: AnalyzeResponse = await response.json();
      setResults(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while communicating with the analysis server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const loadScenario = (index: number) => {
    setAdText(SAMPLE_SCENARIOS[index].ad);
    setChatText(SAMPLE_SCENARIOS[index].chat);
    setError(null);
  };

  return (
    <section id="analyzer" className="py-16 md:py-24 border-t border-slate-800 bg-[#060b16] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
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
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
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

        {/* Dual Input Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Advertisement Input */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4" />
                  <span>1. Seller Advertisement / Public Post</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">{adText.length} characters</span>
              </div>
              <textarea
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Paste the seller's Facebook page caption, post text, or website product description..."
                rows={9}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-sans leading-relaxed resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Supports Bangla, English, and Banglish (e.g., &quot;dam 1200 taka, free delivery&quot;).
            </p>
          </div>

          {/* Seller Chat Input */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Seller Chat / Messenger Conversation</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">{chatText.length} characters</span>
              </div>
              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Paste the direct conversation from Facebook Messenger, WhatsApp, or SMS..."
                rows={9}
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
              {error.includes('Gemini API key is not configured') && (
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
