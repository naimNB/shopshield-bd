import React from 'react';
import { Quote, AlertCircle, Info } from 'lucide-react';
import type { UnifiedFinding } from '../../types/api';
import { EvidenceBadge } from './EvidenceBadge';
import { SourceAttribution } from './SourceAttribution';

interface UnifiedFindingCardProps {
  finding: UnifiedFinding;
}

export const UnifiedFindingCard: React.FC<UnifiedFindingCardProps> = ({ finding }) => {
  // Format observed value cleanly
  const formatObservedValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'নির্দিষ্ট নয় (Not Specified)';
    if (typeof val === 'boolean') return val ? 'হ্যাঁ (Available/Required)' : 'না (Not Available/Not Required)';
    if (typeof val === 'number') {
      if (finding.claim_type.includes('price') || finding.claim_type.includes('advance') || finding.claim_type.includes('charge')) {
        return `৳ ${val.toLocaleString('bn-BD')}`;
      }
      return val.toString();
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const getBorderColor = (status: string, severity: string) => {
    if (status === 'CONTRADICTION' || severity === 'high') return 'border-rose-500/35 bg-rose-950/15';
    if (status === 'MISSING_INFORMATION' || status === 'NEEDS_REVIEW' || severity === 'medium') return 'border-amber-500/30 bg-amber-950/15';
    if (status === 'AGREEMENT') return 'border-teal-500/30 bg-teal-950/15';
    return 'border-slate-800 bg-[#0a1224]';
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all space-y-3.5 shadow-sm ${getBorderColor(
        finding.status,
        finding.severity
      )}`}
    >
      {/* Header: Field Label + Evidence Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-100 text-sm sm:text-base font-sans">
            {finding.field_label}
          </h4>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
            {finding.claim_type}
          </span>
        </div>
        <EvidenceBadge status={finding.status} />
      </div>

      {/* Observed Value */}
      <div className="flex items-baseline gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800/80">
        <span className="text-xs text-slate-400 font-medium">পর্যবেক্ষিত মান (Observed Value):</span>
        <span className="text-sm font-bold text-slate-100">
          {formatObservedValue(finding.observed_value)}
        </span>
      </div>

      {/* Verbatim Evidence Quote */}
      {finding.evidence_quote && (
        <div className="bg-slate-950/70 border-l-3 border-teal-500/80 rounded-r-lg p-3 text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1 font-mono">
            <Quote className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
            <span>মূল উদ্ধৃতি (Verbatim Evidence):</span>
          </div>
          <p className="italic font-serif text-slate-100 break-words leading-relaxed">
            &ldquo;{finding.evidence_quote}&rdquo;
          </p>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
        {finding.explanation}
      </p>

      {/* Limitations Disclaimer */}
      {finding.limitations && (
        <div className="flex items-start gap-2 bg-slate-900/60 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="text-slate-200 font-semibold">সীমাবদ্ধতা:</strong> {finding.limitations}
          </p>
        </div>
      )}

      {/* Review Reason if NEEDS_REVIEW */}
      {finding.review_reason && (
        <div className="flex items-start gap-2 bg-yellow-500/10 rounded-lg p-2.5 text-xs text-yellow-200 border border-yellow-500/30">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong className="font-semibold">পর্যালোচনার কারণ:</strong> {finding.review_reason}
          </p>
        </div>
      )}

      {/* Provenance Footer */}
      <div className="pt-2.5 border-t border-slate-800/80">
        <SourceAttribution
          sourceType={finding.source_type}
          verificationStatus={finding.verification_status}
          retrievalDate={finding.retrieval_date}
          sourceUrl={finding.source_url}
        />
      </div>
    </div>
  );
};
