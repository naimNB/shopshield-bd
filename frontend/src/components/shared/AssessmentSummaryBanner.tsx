import React from 'react';
import { AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import type { AssessmentState, AssessmentSummary } from '../../types/api';
import { useLanguage } from '../../context/LanguageContext';

interface AssessmentSummaryBannerProps {
  assessment?: AssessmentState;
  summary?: AssessmentSummary | null;
}

export const AssessmentSummaryBanner: React.FC<AssessmentSummaryBannerProps> = ({
  assessment = 'NO_SPECIFIC_WARNING_SIGNS_FOUND',
  summary,
}) => {
  const { language, t } = useLanguage();

  const isWarning = assessment === 'WARNING_SIGNS_FOUND';
  const isNoWarning = assessment === 'NO_SPECIFIC_WARNING_SIGNS_FOUND';

  const badgeText = isWarning
    ? t('warningSignsBadge')
    : isNoWarning
    ? t('noWarningBadge')
    : t('insufficientBadge');

  const headline = summary
    ? language === 'bn'
      ? summary.headline_bn
      : summary.headline_en
    : badgeText;

  const explanation = summary
    ? language === 'bn'
      ? summary.explanation_bn
      : summary.explanation_en
    : null;

  const primaryAction = summary
    ? language === 'bn'
      ? summary.primary_action_bn
      : summary.primary_action_en
    : null;

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 space-y-4 border transition-all shadow-sm ${
        isWarning
          ? 'bg-rose-950/20 border-rose-500/40'
          : isNoWarning
          ? 'bg-teal-950/20 border-teal-500/40'
          : 'bg-slate-900/80 border-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isWarning
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isNoWarning
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            ) : isNoWarning ? (
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">
              {t('assessmentBannerTitle')}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans tracking-tight">
              {headline}
            </h3>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-center ${
            isWarning
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
              : isNoWarning
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isWarning ? 'bg-rose-400' : isNoWarning ? 'bg-teal-400' : 'bg-slate-400'
            }`}
            aria-hidden="true"
          />
          <span>{badgeText}</span>
        </span>
      </div>

      {explanation && (
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {explanation}
        </p>
      )}

      {/* Primary Recommended Buyer Action */}
      {primaryAction && (
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block font-sans">
            {t('recommendedActionLabel')}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 font-sans">
            {primaryAction}
          </p>
        </div>
      )}

      {/* Explicit Disclaimer on No Specific Warning Signs Found */}
      {isNoWarning && (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 font-sans leading-relaxed">
          {t('notProofNotice')}
        </div>
      )}
    </div>
  );
};
