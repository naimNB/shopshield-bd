import React from 'react';
import { ExternalLink, Database, Image, Shield, AlertCircle, FileText } from 'lucide-react';
import type { SourceType, VerificationStatus } from '../../types/api';

interface SourceAttributionProps {
  sourceType: SourceType | string;
  verificationStatus?: VerificationStatus | string;
  retrievalDate?: string;
  sourceUrl?: string | null;
  confidence?: string | null;
  className?: string;
}

const SOURCE_LABELS: Record<string, { labelBn: string; labelEn: string; icon: React.FC<{ className?: string }> }> = {
  USER_SCREENSHOT: {
    labelBn: 'ব্যবহারকারীর স্ক্রিনশট',
    labelEn: 'User Screenshot (Unverified)',
    icon: Image,
  },
  INTERNET_ARCHIVE_CDX: {
    labelBn: 'ইন্টারনেট আর্কাইভ CDX',
    labelEn: 'Wayback CDX API',
    icon: Database,
  },
  WAYBACK_SNAPSHOT_PAGE: {
    labelBn: 'ওয়েব্যাক পেজ স্ন্যাপশট',
    labelEn: 'Archive Snapshot Content',
    icon: Database,
  },
  ADVERTISEMENT_TEXT: {
    labelBn: 'বিজ্ঞাপনের মূল টেক্সট',
    labelEn: 'Advertisement Text',
    icon: FileText,
  },
  SELLER_CHAT: {
    labelBn: 'বিক্রেতার চ্যাট বার্তা',
    labelEn: 'Seller Chat Message',
    icon: FileText,
  },
  USER_INPUT: {
    labelBn: 'ব্যবহারকারীর ইনপুট',
    labelEn: 'User Provided',
    icon: FileText,
  },
  COMMERCE_REGISTRY: {
    labelBn: 'বাণিজ্যিক রেজিস্ট্রি',
    labelEn: 'Commerce Registry',
    icon: Shield,
  },
};

export const SourceAttribution: React.FC<SourceAttributionProps> = ({
  sourceType,
  verificationStatus,
  retrievalDate,
  sourceUrl,
  className = '',
}) => {
  const sourceInfo = SOURCE_LABELS[sourceType] || {
    labelBn: sourceType,
    labelEn: sourceType,
    icon: FileText,
  };
  const Icon = sourceInfo.icon;

  const isIndependent = verificationStatus === 'INDEPENDENTLY_RETRIEVED';
  const isUnverified = verificationStatus === 'USER_PROVIDED_UNVERIFIED';

  // Format retrieval date
  let formattedTime = retrievalDate;
  if (retrievalDate) {
    try {
      const dt = new Date(retrievalDate);
      if (!isNaN(dt.getTime())) {
        formattedTime = dt.toLocaleString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Dhaka',
        });
      }
    } catch {
      // Keep original
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      {/* Source origin badge */}
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium">{sourceInfo.labelBn}</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">({sourceInfo.labelEn})</span>
      </span>

      {/* Verification status badge */}
      {isIndependent && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Shield className="w-3 h-3" />
          <span>স্বাধীন রেকর্ড (Independently Retrieved)</span>
        </span>
      )}
      {isUnverified && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>অযাচাইকৃত স্ক্রিনশট দাবি (Self-Reported)</span>
        </span>
      )}

      {/* Retrieval timestamp */}
      {formattedTime && (
        <span className="text-slate-400 font-mono text-[11px]">
          যাচাই: {formattedTime}
        </span>
      )}

      {/* Source link */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors ml-auto"
        >
          <span>আর্কাইভ লিঙ্ক</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
