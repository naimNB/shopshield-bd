import React from 'react';
import { Server, Layout, Cpu, CheckCircle2, Code2 } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="py-16 sm:py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">
            সিস্টেম ডিজাইন ও আর্কিটেকচার
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
            আধুনিক ও নিরাপদ মনোরেপো আর্কিটেকচার
          </p>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            শপশিল্ড বিডি একটি সম্পূর্ণ টাইপ-সেফ মনোরেপো, যেখানে উচ্চগতির পাইথন ব্যাকএন্ড ও আধুনিক রিঅ্যাক্ট ফ্রন্টএন্ড আলাদাভাবে পরিচালিত হয়।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Stack */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">ফ্রন্টএন্ড ওয়ার্কস্পেস</h3>
                  <span className="text-xs text-slate-400 font-mono">frontend/</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>React 19 & TypeScript 5</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Vite 6 Fast Bundler</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Tailwind CSS & Hind Siliguri Font</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Lucide Icons & WCAG AA Contrast</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              টাইপ-সেফ সেন্ট্রালাইজড এপিআই ক্লায়েন্ট ও রেসপন্সিভ মোবাইল লেআউট।
            </div>
          </div>

          {/* Backend Stack */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">ব্যাকএন্ড ওয়ার্কস্পেস</h3>
                  <span className="text-xs text-slate-400 font-mono">backend/</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Python 3.12+ & FastAPI</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pydantic v2 Strict Models</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Wayback Machine CDX API & SSRF Guard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>OpenAPI Swagger (/docs) & CORS Middleware</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              ১২০+ অটোমেটেড টেস্ট কেস এবং ডেটার নির্ভরযোগ্যতা নিশ্চিতকারী পাইপলাইন।
            </div>
          </div>

          {/* AI & Verification Pipeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">এআই ইঞ্জিন ও কোয়ালিটি গেট</h3>
                  <span className="text-xs text-slate-400 font-mono">services/ & tests/</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Google Gemini 2.5 Flash Multimodal</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>অ্যান্টি-হ্যালোসিনেশন কোট ভ্যালিডেটর</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>বাংলাদেশ পেমেন্ট রুলস ইঞ্জিন</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>HTML স্যানিটাইজার ও মেমোরি-অনলি OCR</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              সবগুলো যাচাই প্রমাণভিত্তিক, কোনো মনগড়া পরিসংখ্যান তৈরি করা হয় না।
            </div>
          </div>
        </div>

        {/* Monorepo directory map */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="flex items-center space-x-2 text-teal-400 mb-3 font-semibold">
            <Code2 className="w-4 h-4" />
            <span>ShopShield BD Monorepo Architecture</span>
          </div>
          <pre className="text-slate-400 leading-relaxed">
{`shopshield-bd/
├── backend/app/
│   ├── routes/              # FastAPI routers (/analyze, /analyze-ad, /seller-history, /health)
│   ├── services/            # ai_extractor, rules_engine, wayback_service, screenshot_ocr
│   ├── schemas/             # Pydantic v2 data models, claims, unified evidence
│   └── utils/               # ssrf_validator, html_sanitizer, temporal_comparison
├── frontend/src/
│   ├── components/          # BuyerVerificationHub, Navbar, Hero, Features
│   ├── components/workflows # AdQuickCheckView, HistoricalComparisonView, etc.
│   ├── components/shared/   # EvidenceBadge, PaymentWarningsCard, BuyerQuestionsCard
│   ├── services/api.ts      # Centralized typed API client
│   └── types/api.ts         # TypeScript schema mirrors
├── tests/                   # 120+ pytest tests verifying safety, extraction, and rules
└── vercel.json              # Production serverless deployment configuration`}
          </pre>
        </div>
      </div>
    </section>
  );
};
