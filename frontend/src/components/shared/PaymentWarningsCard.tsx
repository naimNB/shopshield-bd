import React from 'react';
import { ShieldAlert, AlertTriangle, Info, ArrowRight, Quote } from 'lucide-react';
import type { PaymentWarning } from '../../types/api';
import { useLanguage } from '../../context/LanguageContext';

interface PaymentWarningsCardProps {
  warnings: PaymentWarning[];
  title?: string;
}

export const PaymentWarningsCard: React.FC<PaymentWarningsCardProps> = ({
  warnings,
  title,
}) => {
  const { language, t } = useLanguage();

  if (!warnings || warnings.length === 0) return null;

  const cardTitle = title || t('warningsCardTitle');

  const getSeverityStyle = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === 'high' || sev === 'critical' || sev === 'danger') {
      return {
        cardBg: 'bg-rose-950/20 border-rose-500/40',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        badgeText: language === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk',
        icon: ShieldAlert,
        iconColor: 'text-rose-400',
      };
    }
    if (sev === 'medium' || sev === 'warning' || sev === 'caution') {
      return {
        cardBg: 'bg-amber-950/20 border-amber-500/40',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        badgeText: language === 'bn' ? 'সতর্কতা' : 'Caution',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
      };
    }
    return {
      cardBg: 'bg-slate-900 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      badgeText: language === 'bn' ? 'তথ্যমূলক' : 'Informational',
      icon: Info,
      iconColor: 'text-slate-400',
    };
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
        <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">{cardTitle}</h3>
      </div>

      <div className="space-y-3">
        {warnings.map((warning, idx) => {
          const style = getSeverityStyle(warning.severity);
          const Icon = style.icon;

          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 sm:p-5 space-y-3 transition-colors shadow-sm ${style.cardBg}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 shrink-0 ${style.iconColor}`} aria-hidden="true" />
                  <span className="font-bold text-slate-100 text-sm sm:text-base font-sans">
                    {warning.type}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badgeBg}`}
                >
                  {style.badgeText}
                </span>
              </div>

              {/* Explanation */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {warning.explanation}
              </p>

              {/* Supporting evidence quote if provided */}
              {warning.supporting_evidence && (
                <div className="bg-slate-950/70 border-l-3 border-amber-500/70 rounded-r-lg p-3 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
                    <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                    <span>{t('evidenceQuoteLabel')}</span>
                  </div>
                  <p className="italic font-serif break-words">&ldquo;{warning.supporting_evidence}&rdquo;</p>
                </div>
              )}

              {/* Suggested buyer action */}
              {warning.suggested_buyer_action && (
                <div className="flex items-start gap-2.5 bg-slate-950/80 rounded-xl p-3 text-xs sm:text-sm border border-slate-800">
                  <ArrowRight className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-slate-200 font-sans leading-relaxed">
                    <strong className="text-teal-300 font-bold">{t('buyerActionLabel')} </strong>
                    {warning.suggested_buyer_action}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
