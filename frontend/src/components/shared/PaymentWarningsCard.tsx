import React from 'react';
import { ShieldAlert, AlertTriangle, Info, ArrowRight, Quote } from 'lucide-react';
import type { PaymentWarning } from '../../types/api';

interface PaymentWarningsCardProps {
  warnings: PaymentWarning[];
  title?: string;
}

export const PaymentWarningsCard: React.FC<PaymentWarningsCardProps> = ({
  warnings,
  title = 'পেমেন্ট ও অগ্রিম পরিশোধ সংক্রান্ত সতর্কতা',
}) => {
  if (!warnings || warnings.length === 0) return null;

  const getSeverityStyle = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === 'high' || sev === 'critical' || sev === 'danger') {
      return {
        cardBg: 'bg-rose-950/20 border-rose-500/40',
        badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        badgeText: 'উচ্চ ঝুঁকি (High Risk)',
        icon: ShieldAlert,
        iconColor: 'text-rose-400',
      };
    }
    if (sev === 'medium' || sev === 'warning') {
      return {
        cardBg: 'bg-amber-950/20 border-amber-500/40',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        badgeText: 'সতর্কতা (Caution)',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
      };
    }
    return {
      cardBg: 'bg-sky-950/20 border-sky-500/30',
      badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      badgeText: 'পরামর্শ (Advisory)',
      icon: Info,
      iconColor: 'text-sky-400',
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-100">{title}</h3>
      </div>

      <div className="space-y-3">
        {warnings.map((warning, idx) => {
          const style = getSeverityStyle(warning.severity);
          const Icon = style.icon;

          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 sm:p-5 space-y-3 transition-colors ${style.cardBg}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  <span className="font-semibold text-slate-200 text-sm sm:text-base font-sans">
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
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {warning.explanation}
              </p>

              {/* Supporting evidence quote if provided */}
              {warning.supporting_evidence && (
                <div className="bg-slate-950/60 border-l-2 border-amber-500/50 rounded-r-lg p-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
                    <Quote className="w-3 h-3 text-amber-400" />
                    <span>উদ্ধৃতি প্রমাণ (Supporting Evidence):</span>
                  </div>
                  <p className="italic font-serif">&ldquo;{warning.supporting_evidence}&rdquo;</p>
                </div>
              )}

              {/* Suggested buyer action */}
              {warning.suggested_buyer_action && (
                <div className="flex items-start gap-2 bg-slate-900/80 rounded-lg p-3 text-xs sm:text-sm border border-slate-800">
                  <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-200">
                    <strong className="text-emerald-400">ক্রেতার করণীয়: </strong>
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
