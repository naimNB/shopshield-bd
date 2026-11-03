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
  description = 'পণ্য অর্ডার করার আগে নিচের সুনির্দিষ্ট প্রশ্নগুলো বিক্রেতার ফেসবুক ইনবক্স বা হোয়াটসঅ্যাপে কপি করে পাঠান:',
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
    <div className="rounded-xl border border-teal-500/30 bg-teal-950/15 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="font-bold text-teal-200 text-sm sm:text-base font-sans">
              {title}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">{description}</p>
          </div>
        </div>

        {questions.length > 1 && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[40px]"
            aria-label="সব প্রশ্ন একসাথে ক্লিপবোর্ডে কপি করুন"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            <span>{copiedAll ? 'সব কপি হয়েছে!' : 'সব প্রশ্ন কপি করুন'}</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {questions.map((question, idx) => {
          const isCopied = copiedIndex === idx;
          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 transition-colors"
            >
              <div className="flex items-start gap-2.5 flex-grow min-w-0">
                <HelpCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans break-words">
                  {question}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopySingle(question, idx)}
                title="প্রশ্নটি কপি করুন"
                aria-label={`প্রশ্ন ${idx + 1} কপি করুন: ${question}`}
                className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[42px] focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  isCopied
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
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
