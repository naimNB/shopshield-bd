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
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    icon: FileText,
  },
  AGREEMENT: {
    labelBn: 'মিল রয়েছে',
    labelEn: 'Agreement',
    bg: 'bg-teal-500/10',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    icon: CheckCircle2,
  },
  CONSISTENT: {
    labelBn: 'মিল রয়েছে',
    labelEn: 'Consistent',
    bg: 'bg-teal-500/10',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    icon: CheckCircle2,
  },
  CONTRADICTION: {
    labelBn: 'অসঙ্গতিপূর্ণ শর্ত',
    labelEn: 'Contradiction',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    icon: AlertTriangle,
  },
  MISSING_INFORMATION: {
    labelBn: 'অনুপস্থিত তথ্য',
    labelEn: 'Missing Info',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    icon: HelpCircle,
  },
  INSUFFICIENT_INFORMATION: {
    labelBn: 'অপ্রতুল প্রমাণ',
    labelEn: 'Insufficient Evidence',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    icon: HelpCircle,
  },
  AMBIGUOUS: {
    labelBn: 'দ্ব্যর্থবোধক শর্ত',
    labelEn: 'Ambiguous Term',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    icon: Eye,
  },
  HISTORICAL_CHANGE: {
    labelBn: 'পলিসি পরিবর্তন',
    labelEn: 'Policy Changed',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
    icon: Clock,
  },
  CHANGED: {
    labelBn: 'পরিবর্তিত হয়েছে',
    labelEn: 'Changed',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    icon: Clock,
  },
  UNCHANGED: {
    labelBn: 'অপরিবর্তিত',
    labelEn: 'Unchanged',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: CheckCircle2,
  },
  NEEDS_REVIEW: {
    labelBn: 'পর্যালোচনা প্রয়োজন',
    labelEn: 'Needs Review',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    border: 'border-yellow-500/40',
    icon: AlertCircle,
  },
  SOURCE_UNAVAILABLE: {
    labelBn: 'উৎস অনুপলব্ধ',
    labelEn: 'Source Unavailable',
    bg: 'bg-slate-800/60',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: XCircle,
  },
  NOT_COMPARABLE: {
    labelBn: 'তুলনাযোগ্য নয়',
    labelEn: 'Not Comparable',
    bg: 'bg-slate-800/80',
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
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${config.bg} ${config.text} ${config.border} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
      }`}
    >
      <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{config.labelBn}</span>
      <span className="text-[11px] opacity-75 font-mono hidden sm:inline">({config.labelEn})</span>
    </span>
  );
};
