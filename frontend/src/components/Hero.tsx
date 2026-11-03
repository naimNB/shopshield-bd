import { ArrowRight, FileCheck, AlertTriangle, Lock, Eye, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-sm shadow-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>YUNet AIgnite Buildathon 2026 • Bangladesh E-Commerce Safety</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Shop Safe on F-Commerce.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Lock Every Promise in Writing.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Millions in Bangladesh buy through Facebook, WhatsApp, and social pages every day.
            Too often, buyers fall prey to advance payment scams, counterfeit deliveries, and denied
            chat warranties. <strong className="text-white font-medium">ShopShield BD</strong> uses
            multimodal AI to audit purchase promises, verify payment channels, and give buyers
            ironclad confidence before they send a single Taka.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#analyzer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Try AI Promise Analyzer Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
            >
              <span>Inspect FastAPI Backend (/docs)</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-10 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                <FileCheck className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Promise Pass</span>
              </div>
              <p className="text-xs text-slate-400">Verifiable digital proof of return & warranty terms</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-amber-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">bKash/Nagad Radar</span>
              </div>
              <p className="text-xs text-slate-400">Flags personal P2P vs. verified merchant numbers</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Courier Parity</span>
              </div>
              <p className="text-xs text-slate-400">Cross-checks Steadfast, Pathao & RedX tracking</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-purple-400 mb-1">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Escrow Safety</span>
              </div>
              <p className="text-xs text-slate-400">Step-by-step risk mitigation before sending payment</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
