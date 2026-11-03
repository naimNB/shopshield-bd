import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  Eye,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { UnifiedFindingStatus, TemporalChangeStatus } from '../../types/api';

interface EvidenceBadgeProps {
  status: UnifiedFindingStatus | TemporalChangeStatus | 'CONSISTENT' | 'INSUFFICIENT_INFORMATION' | string;
  size?: 'sm' | 'md';
}

interface BadgeConfig {
  labelBn: string;
  labelEn: string;
  bg: string;
  text: string;
  border: string;
  icon: React.FC<{ className?: string }>;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  STATED_CLAIM: {
    labelBn: 'দাবীকৃত শর্ত',
    labelEn: 'Stated Claim (Unverified)',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: FileText,
  },
  AGREEMENT: {
    labelBn: 'মিল রয়েছে',
    labelEn: 'Agreement',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  CONSISTENT: {
    labelBn: 'মিল রয়েছে',
    labelEn: 'Consistent',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  CONTRADICTION: {
    labelBn: 'অসঙ্গতিপূর্ণ শর্ত',
    labelEn: 'Contradiction',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertTriangle,
  },
  MISSING_INFORMATION: {
    labelBn: 'অনুপস্থিত তথ্য',
    labelEn: 'Missing Info',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: HelpCircle,
  },
  INSUFFICIENT_INFORMATION: {
    labelBn: 'অপ্রতুল তথ্য',
    labelEn: 'Insufficient Evidence',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: HelpCircle,
  },
  AMBIGUOUS: {
    labelBn: 'অস্পষ্ট বা দ্ব্যর্থবোধক',
    labelEn: 'Ambiguous Term',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: Eye,
  },
  HISTORICAL_CHANGE: {
    labelBn: 'পলিসি পরিবর্তন',
    labelEn: 'Policy Changed',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    icon: Clock,
  },
  CHANGED: {
    labelBn: 'পরিবর্তিত হয়েছে',
    labelEn: 'Changed',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Clock,
  },
  UNCHANGED: {
    labelBn: 'অপরিবর্তিত',
    labelEn: 'Unchanged',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    icon: CheckCircle2,
  },
  NEEDS_REVIEW: {
    labelBn: 'পর্যালোচনা প্রয়োজন',
    labelEn: 'Needs Review',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    icon: AlertCircle,
  },
  SOURCE_UNAVAILABLE: {
    labelBn: 'উৎস অনুপলব্ধ',
    labelEn: 'Source Unavailable',
    bg: 'bg-slate-700/20',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: XCircle,
  },
  NOT_COMPARABLE: {
    labelBn: 'তুলনাযোগ্য নয়',
    labelEn: 'Not Comparable',
    bg: 'bg-slate-800',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: HelpCircle,
  },
};

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ status, size = 'md' }) => {
  const config = BADGE_CONFIG[status] || {
    labelBn: status,
    labelEn: status,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: FileText,
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors ${config.bg} ${config.text} ${config.border} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
      }`}
    >
      <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{config.labelBn}</span>
      <span className="text-[10px] opacity-75 font-mono hidden sm:inline">({config.labelEn})</span>
    </span>
  );
};
