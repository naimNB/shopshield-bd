import React, { useState } from 'react';
import { HelpCircle, Copy, Check, MessageSquare } from 'lucide-react';

interface BuyerQuestionsCardProps {
  questions: string[];
  title?: string;
  description?: string;
}

export const BuyerQuestionsCard: React.FC<BuyerQuestionsCardProps> = ({
  questions,
  title = 'বিক্রেতাকে নিশ্চিতকরণের জন্য জিজ্ঞাসা করুন',
  description = 'পণ্য অর্ডার করার আগে নিচের সুনির্দিষ্ট প্রশ্নগুলো বিক্রেতার ফেসবুক ইনবক্স বা হোয়াটসঅ্যাপে কপি করে পাঠান:',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!questions || questions.length === 0) return null;

  const handleCopySingle = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyAll = async () => {
    try {
      const fullText = questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n');
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-300 text-sm sm:text-base">
              {title}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        {questions.length > 1 && (
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'সব কপি হয়েছে!' : 'সব প্রশ্ন কপি করুন'}</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {questions.map((question, idx) => {
          const isCopied = copiedIndex === idx;
          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start gap-2.5 flex-grow">
                <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {question}
                </p>
              </div>

              <button
                onClick={() => handleCopySingle(question, idx)}
                title="প্রশ্নটি কপি করুন"
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  isCopied
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
