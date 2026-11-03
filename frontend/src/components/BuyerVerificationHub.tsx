import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitCompare,
  History,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AdQuickCheckView } from './workflows/AdQuickCheckView';
import { PurchasePromiseAnalyzer } from './PurchasePromiseAnalyzer';
import { SellerHistoryIntelligence } from './SellerHistoryIntelligence';
import { HistoricalComparisonView } from './workflows/HistoricalComparisonView';

export type WorkflowTab = 'ad-check' | 'ad-vs-chat' | 'seller-history' | 'historical-comparison';

interface WorkflowMeta {
  id: WorkflowTab;
  step: string;
  titleBn: string;
  titleEn: string;
  badge: string;
  descriptionBn: string;
  icon: React.FC<{ className?: string }>;
}

const WORKFLOWS: WorkflowMeta[] = [
  {
    id: 'ad-check',
    step: 'ধাপ ১',
    titleBn: 'বিজ্ঞাপন দ্রুত যাচাই',
    titleEn: 'Ad Quick Check',
    badge: 'চ্যাট শুরুর পূর্বে',
    descriptionBn: 'বিজ্ঞাপনের অসম্পূর্ণ শর্ত, অদৃশ্য ডেলিভারি ফি ও অগ্রিম পেমেন্টের ঝুঁকি যাচাই',
    icon: Sparkles,
  },
  {
    id: 'ad-vs-chat',
    step: 'ধাপ ২',
    titleBn: 'প্রতিশ্রুতি বনাম চ্যাট',
    titleEn: 'Promise Cross-Check',
    badge: 'ইনবক্স চ্যাট যাচাই',
    descriptionBn: 'বিজ্ঞাপনে দেওয়া প্রতিশ্রুতির সাথে বিক্রেতার ইনবক্স চ্যাটের অমিল ও অসঙ্গতি ধরা',
    icon: GitCompare,
  },
  {
    id: 'seller-history',
    step: 'ধাপ ৩',
    titleBn: 'সেলার ব্যাকগ্রাউন্ড',
    titleEn: 'Seller History',
    badge: 'পেজ ও ডোমেইন রেকর্ড',
    descriptionBn: 'ফেসবুক পেজ ট্রান্সপারেন্সি ও ইন্টারনেট আর্কাইভ থেকে নির্ভরযোগ্য ব্যাকগ্রাউন্ড তথ্য',
    icon: History,
  },
  {
    id: 'historical-comparison',
    step: 'ধাপ ৪',
    titleBn: 'নীতিমালা পরিবর্তন',
    titleEn: 'Policy Evolution',
    badge: 'আর্কাইভ স্ন্যাপশট',
    descriptionBn: 'সময়ের সাথে সাথে ওয়েবসাইটের রিটার্ন পলিসি, ওয়ারেন্টি বা মূল্যের পরিবর্তন ট্র্যাকিং',
    icon: Clock,
  },
];

export const BuyerVerificationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('ad-check');

  // Synchronize hash with tab selection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#ad-check' || hash === '#quick-check') {
        setActiveTab('ad-check');
      } else if (hash === '#analyzer' || hash === '#ad-vs-chat' || hash === '#chat') {
        setActiveTab('ad-vs-chat');
      } else if (hash === '#seller-history' || hash === '#history') {
        setActiveTab('seller-history');
      } else if (hash === '#compare' || hash === '#policy-evolution') {
        setActiveTab('historical-comparison');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <section id="analyzer" className="py-10 sm:py-14 bg-[#070c18] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Hub Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>ভোক্তা যাচাইকরণ কেন্দ্র • ৪টি স্বতন্ত্র প্রমাণ পদ্ধতি</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            প্রমাণভিত্তিক যাচাইকরণ প্যানেল
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans max-w-2xl mx-auto">
            আপনার বর্তমান কেনাকাটার পর্যায় অনুযায়ী নিচের উপযুক্ত ট্যাবটি নির্বাচন করুন। কোনো ট্যাব পরিবর্তন করলে আপনার পূর্বে লেখা ডাটা হারিয়ে যাবে না।
          </p>
        </div>

        {/* 4-Workflow Tab Navigation with full ARIA semantics */}
        <div
          role="tablist"
          aria-label="যাচাইকরণ পদ্ধতির তালিকা"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md"
        >
          {WORKFLOWS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.location.hash = tab.id;
                }}
                className={`relative p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[52px] ${
                  isActive
                    ? 'bg-slate-800/90 border-2 border-teal-500/60 shadow-md shadow-teal-950/40 text-white'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-teal-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{tab.step}</span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-100 font-sans flex items-center gap-1.5">
                    <span>{tab.titleBn}</span>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mb-1.5">
                    {tab.titleEn}
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-slate-400 font-sans line-clamp-2">
                  {tab.descriptionBn}
                </p>

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-t-full bg-teal-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display - Persistent DOM mount preserves state across tab switching */}
        <div className="transition-all duration-150">
          <div
            id="tabpanel-ad-check"
            role="tabpanel"
            aria-labelledby="tab-ad-check"
            className={activeTab === 'ad-check' ? 'block' : 'hidden'}
          >
            <AdQuickCheckView />
          </div>

          <div
            id="tabpanel-ad-vs-chat"
            role="tabpanel"
            aria-labelledby="tab-ad-vs-chat"
            className={activeTab === 'ad-vs-chat' ? 'block' : 'hidden'}
          >
            <PurchasePromiseAnalyzer />
          </div>

          <div
            id="tabpanel-seller-history"
            role="tabpanel"
            aria-labelledby="tab-seller-history"
            className={activeTab === 'seller-history' ? 'block' : 'hidden'}
          >
            <SellerHistoryIntelligence />
          </div>

          <div
            id="tabpanel-historical-comparison"
            role="tabpanel"
            aria-labelledby="tab-historical-comparison"
            className={activeTab === 'historical-comparison' ? 'block' : 'hidden'}
          >
            <HistoricalComparisonView />
          </div>
        </div>
      </div>
    </section>
  );
};
