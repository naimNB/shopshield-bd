import { AlertCircle, Sparkles, RotateCcw } from 'lucide-react';

export const LoadingState: React.FC<{
  title?: string;
  message?: string;
  steps?: string[];
}> = ({
  title = 'বিশ্লেষণ চলছে...',
  message = 'ShopShield AI প্রমাণাদি যাচাই করছে এবং অসঙ্গতি অনুসন্ধান করছে...',
  steps = [
    'বিজ্ঞাপন ও চ্যাট থেকে প্রতিশ্রুতির শর্তাবলি আলাদা করা হচ্ছে...',
    'ক্যাশ অন ডেলিভারি এবং অগ্রিম পেমেন্টের শর্ত পর্যালোচনা করা হচ্ছে...',
    'প্রমাণ উদ্ধৃতি ও সত্যতা যাচাই নিয়মাবলি পরীক্ষা করা হচ্ছে...',
  ],
}) => {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-8 text-center space-y-5">
      <div className="relative w-16 h-16 mx-auto">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h4 className="text-base sm:text-lg font-bold text-slate-100">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-400">{message}</p>
      </div>

      {steps.length > 0 && (
        <div className="max-w-sm mx-auto text-left space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
            চলমান পদক্ষেপ (Execution Pipeline):
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
}> = ({ title = 'অনুরোধ প্রক্রিয়াকরণে ত্রুটি হয়েছে', message, onRetry }) => {
  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-6 sm:p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-base font-bold text-rose-200">{title}</h4>
        <p className="text-xs sm:text-sm text-rose-300/90 leading-relaxed font-sans">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>পুনরায় চেষ্টা করুন</span>
        </button>
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-base font-semibold text-slate-200">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};
