import React from 'react';
import { ExternalLink, Database, Image, Shield, AlertCircle, FileText } from 'lucide-react';
import type { SourceType, VerificationStatus } from '../../types/api';
import { useLanguage } from '../../context/LanguageContext';

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
    labelEn: 'User Screenshot',
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
  const { language } = useLanguage();
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
        formattedTime = dt.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span className="font-medium">{language === 'bn' ? sourceInfo.labelBn : sourceInfo.labelEn}</span>
      </span>

      {/* Verification status badge */}
      {isIndependent && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30">
          <Shield className="w-3.5 h-3.5 shrink-0 text-teal-400" aria-hidden="true" />
          <span>{language === 'bn' ? 'স্বাধীন রেকর্ড' : 'Independently Retrieved'}</span>
        </span>
      )}
      {isUnverified && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          <span>{language === 'bn' ? 'অযাচাইকৃত স্ক্রিনশট দাবি' : 'Self-Reported Claim'}</span>
        </span>
      )}

      {/* Retrieval timestamp */}
      {formattedTime && (
        <span className="text-slate-400 font-mono text-[11px] ml-1">
          {language === 'bn' ? 'যাচাই:' : 'Verified:'} {formattedTime}
        </span>
      )}

      {/* Source link */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={language === 'bn' ? 'আর্কাইভ স্ন্যাপশটের উৎস লিঙ্কটি নতুন ট্যাবে খুলুন' : 'Open archive snapshot source link in new tab'}
          className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors ml-auto text-xs py-0.5"
        >
          <span>{language === 'bn' ? 'আর্কাইভ লিঙ্ক' : 'Archive Link'}</span>
          <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
        </a>
      )}
    </div>
  );
};
