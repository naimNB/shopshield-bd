import React from 'react';
import { AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LoadingState: React.FC<{
  title?: string;
  message?: string;
  steps?: string[];
}> = ({ title, message, steps }) => {
  const { language } = useLanguage();
  const defaultTitle = language === 'bn' ? 'বিশ্লেষণ চলছে...' : 'Analysis in progress...';
  const defaultMessage =
    language === 'bn'
      ? 'ShopShield AI প্রমাণাদি যাচাই করছে এবং অসঙ্গতি অনুসন্ধান করছে...'
      : 'ShopShield AI is verifying evidence and detecting inconsistencies...';
  const defaultSteps =
    language === 'bn'
      ? [
          'বিজ্ঞাপন ও চ্যাট থেকে প্রতিশ্রুতির শর্তাবলি আলাদা করা হচ্ছে...',
          'ক্যাশ অন ডেলিভারি এবং অগ্রিম পেমেন্টের শর্ত পর্যালোচনা করা হচ্ছে...',
          'প্রমাণ উদ্ধৃতি ও সত্যতা যাচাই নিয়মাবলি পরীক্ষা করা হচ্ছে...',
        ]
      : [
          'Extracting promise terms from advertisement and conversation...',
          'Reviewing Cash on Delivery and advance payment terms...',
          'Verifying evidence quotes and inspection rules...',
        ];

  const actualTitle = title ?? defaultTitle;
  const actualMessage = message ?? defaultMessage;
  const actualSteps = steps ?? defaultSteps;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-teal-500/30 bg-[#0a1224] p-6 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-md"
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto">
        <div className="w-full h-full rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-teal-400">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h4 className="text-base sm:text-lg font-bold text-slate-100 font-sans">{actualTitle}</h4>
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">{actualMessage}</p>
      </div>

      {actualSteps.length > 0 && (
        <div className="max-w-sm mx-auto text-left space-y-2 bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <p className="text-xs font-mono text-teal-300 uppercase tracking-wider font-semibold">
            {language === 'bn' ? 'চলমান পদক্ষেপ:' : 'Execution Pipeline:'}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
            {actualSteps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => {
  const { language } = useLanguage();
  const defaultTitle = language === 'bn' ? 'অনুরোধ প্রক্রিয়াকরণে ত্রুটি হয়েছে' : 'Request Processing Error';
  const actualTitle = title ?? defaultTitle;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 sm:p-7 text-center space-y-4 shadow-md"
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-base font-bold text-rose-200 font-sans">{actualTitle}</h4>
        <p className="text-xs sm:text-sm text-rose-200 leading-relaxed font-sans">{message}</p>
      </div>
      {onRetry && (
        <div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.FC<{ className?: string }>;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}> = ({ icon: Icon = Sparkles, title, description, actionButton }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0a1224] p-8 sm:p-12 text-center space-y-3.5 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-teal-400 flex items-center justify-center mx-auto border border-slate-700/60">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-base font-bold text-slate-100 font-sans">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">{description}</p>
      </div>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
};
