import React, { useState, useEffect } from 'react';
import { AdQuickCheckView } from './workflows/AdQuickCheckView';
import { PurchasePromiseAnalyzer } from './PurchasePromiseAnalyzer';
import { SellerHistoryIntelligence } from './SellerHistoryIntelligence';

export type WorkflowTab = 'ad-check' | 'ad-vs-chat' | 'seller-history';

interface ChoiceMeta {
  id: WorkflowTab;
  label: string;
}

const CHOICES: ChoiceMeta[] = [
  { id: 'ad-check', label: 'বিজ্ঞাপন যাচাই' },
  { id: 'ad-vs-chat', label: 'বিজ্ঞাপন ও চ্যাট মিলিয়ে দেখুন' },
  { id: 'seller-history', label: 'বিক্রেতার ইতিহাস যাচাই' },
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
      } else if (
        hash === '#seller-history' ||
        hash === '#history' ||
        hash === '#compare' ||
        hash === '#historical-comparison' ||
        hash === '#policy-evolution'
      ) {
        setActiveTab('seller-history');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (id: WorkflowTab) => {
    setActiveTab(id);
    window.location.hash = id;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = (index + 1) % CHOICES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = (index - 1 + CHOICES.length) % CHOICES.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = CHOICES.length - 1;
    }

    if (targetIndex !== -1) {
      const nextChoice = CHOICES[targetIndex];
      handleSelectTab(nextChoice.id);
      const el = document.getElementById(`tab-${nextChoice.id}`);
      el?.focus();
    }
  };

  return (
    <section id="analyzer" className="py-12 sm:py-16 bg-[#070c18] border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Simple Question Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            আপনি কী যাচাই করতে চান?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            আপনার কেনাকাটার পর্যায় অনুযায়ী নিচের যেকোনো একটি অপশন বেছে নিন
          </p>
        </div>

        {/* 3-Choice Segmented Tabs */}
        <div
          role="tablist"
          aria-label="যাচাইকরণ অপশন তালিকা"
          className="flex flex-col sm:flex-row items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-2xl mx-auto w-full"
        >
          {CHOICES.map((choice, idx) => {
            const isActive = activeTab === choice.id;

            return (
              <button
                key={choice.id}
                id={`tab-${choice.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${choice.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelectTab(choice.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`w-full sm:w-auto flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[46px] flex items-center justify-center ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{choice.label}</span>
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
        </div>
      </div>
    </section>
  );
};
