import React from 'react';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProductAuthenticityAssessment } from '../../types/api';
import { useLanguage } from '../../context/LanguageContext';

interface ProductAuthenticityCardProps {
  authenticity?: ProductAuthenticityAssessment | null;
}

export const ProductAuthenticityCard: React.FC<ProductAuthenticityCardProps> = ({ authenticity }) => {
  const { language, t } = useLanguage();

  if (!authenticity) {
    return null;
  }

  const isClaimed = authenticity.status === 'CLAIMED_ORIGINAL';
  const statusLabel = language === 'bn' ? authenticity.status_label_bn : authenticity.status_label_en;
  const explanation = language === 'bn' ? authenticity.explanation_bn : authenticity.explanation_en;
  const steps = language === 'bn' ? authenticity.verification_steps_bn : authenticity.verification_steps_en;
  const disclaimer = language === 'bn' ? authenticity.disclaimer_bn : authenticity.disclaimer_en;

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          </div>
          <h4 className="text-base font-bold text-white font-sans">
            {t('authenticityCardTitle')}
          </h4>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isClaimed
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isClaimed ? 'bg-amber-400' : 'bg-slate-400'}`}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Claim Evidence if claimed in source text */}
      {authenticity.claim_detected && authenticity.claim_evidence && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">
            {t('authenticityEvidenceLabel')}
          </span>
          <blockquote className="text-xs sm:text-sm text-slate-200 font-serif italic border-l-2 border-amber-400/60 pl-2">
            &ldquo;{authenticity.claim_evidence}&rdquo;
          </blockquote>
        </div>
      )}

      {/* Rationale / Explanation */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
        {explanation}
      </p>

      {/* Physical Inspection Steps */}
      {steps && steps.length > 0 && (
        <div className="space-y-2 pt-1">
          <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
            {t('authenticityStepsTitle')}
          </h5>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 font-sans">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11px] sm:text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="leading-relaxed">{disclaimer}</span>
      </div>
    </div>
  );
};
