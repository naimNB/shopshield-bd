import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitCompare,
  History,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AdQuickCheckView } from './workflows/AdQuickCheckView';
import { PurchasePromiseAnalyzer } from './PurchasePromiseAnalyzer';
import { SellerHistoryIntelligence } from './SellerHistoryIntelligence';
import { HistoricalComparisonView } from './workflows/HistoricalComparisonView';

export type WorkflowTab = 'ad-check' | 'ad-vs-chat' | 'seller-history' | 'historical-comparison';

interface WorkflowMeta {
  id: WorkflowTab;
  titleBn: string;
  titleEn: string;
  badge: string;
  descriptionBn: string;
  icon: React.FC<{ className?: string }>;
}

const WORKFLOWS: WorkflowMeta[] = [
  {
    id: 'ad-check',
    titleBn: 'বিজ্ঞাপন যাচাই',
    titleEn: 'Ad Quick Check',
    badge: 'চ্যাট শুরুর পূর্বে',
    descriptionBn: 'বিজ্ঞাপনের অসম্পূর্ণ শর্ত, অদৃশ্য ডেলিভারি ফি ও অগ্রিম পেমেন্টের ঝুঁকি যাচাই',
    icon: Sparkles,
  },
  {
    id: 'ad-vs-chat',
    titleBn: 'বিজ্ঞাপন বনাম চ্যাট',
    titleEn: 'Promise Cross-Check',
    badge: 'ইনবক্স চ্যাট যাচাই',
    descriptionBn: 'বিজ্ঞাপনে দেওয়া প্রতিশ্রুতির সাথে বিক্রেতার ইনবক্স চ্যাটের অমিল ও অসঙ্গতি ধরা',
    icon: GitCompare,
  },
  {
    id: 'seller-history',
    titleBn: 'সেলার ব্যাকগ্রাউন্ড',
    titleEn: 'Seller History',
    badge: 'পেজ ও ডোমেইন রেকর্ড',
    descriptionBn: 'ফেসবুক পেজ ট্রান্সপারেন্সি ও ইন্টারনেট আর্কাইভ থেকে নির্ভরযোগ্য ব্যাকগ্রাউন্ড তথ্য',
    icon: History,
  },
  {
    id: 'historical-comparison',
    titleBn: 'নীতিমালা পরিবর্তন',
    titleEn: 'Policy Evolution',
    badge: 'আর্কাইভ স্ন্যাপশট',
    descriptionBn: 'সময়ের সাথে সাথে ওয়েবসাইটের রিটার্ন পলিসি, ওয়ারেন্টি বা মূল্যের পরিবর্তন ট্র্যাকিং',
    icon: Clock,
  },
];

export const BuyerVerificationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('ad-check');

  // Listen to hash changes (e.g. #analyzer, #seller-history, #ad-check)
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
    <section id="analyzer" className="py-12 sm:py-16 bg-[#070d18] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Unified Buyer Verification Hub</span>
            <span className="text-slate-500">•</span>
            <span>৪ ধাপে সত্যতা যাচাই</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
            প্রতারণাহীন অনলাইন কেনাকাটার জন্য বাস্তব প্রমাণ
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
            কোনো মনগড়া ট্রাস্ট স্কোর বা মিথ্যা প্রতারণার অভিযোগ নয়—প্রমাণভিত্তিক তথ্যের সাহায্যে 
            সঠিক কেনাকাটার সিদ্ধান্ত নিন। আপনার বর্তমান প্রয়োজন অনুযায়ী নিচের ট্যাব নির্বাচন করুন:
          </p>
        </div>

        {/* 4-Workflow Tab Navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          {WORKFLOWS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.location.hash = tab.id;
                }}
                className={`relative p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-slate-800 to-slate-800/90 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 text-white'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-100 font-sans">
                    {tab.titleBn}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mb-2">
                    {tab.titleEn}
                  </p>
                </div>

                <p className="text-[11px] leading-tight text-slate-400/90 font-sans line-clamp-2">
                  {tab.descriptionBn}
                </p>

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="transition-all duration-200">
          {activeTab === 'ad-check' && <AdQuickCheckView />}
          {activeTab === 'ad-vs-chat' && <PurchasePromiseAnalyzer />}
          {activeTab === 'seller-history' && <SellerHistoryIntelligence />}
          {activeTab === 'historical-comparison' && <HistoricalComparisonView />}
        </div>
      </div>
    </section>
  );
};
