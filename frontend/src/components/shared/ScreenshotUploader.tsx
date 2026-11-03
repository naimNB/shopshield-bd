import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ScreenshotUploaderProps {
  label: string;
  helperText?: string;
  onExtractedText: (text: string) => void;
  className?: string;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  label,
  helperText = 'ফেসবুক পোস্ট, চ্যাট বা রসিদের স্ক্রিনশট আপলোড করুন (PNG, JPG, WebP - সর্বোচ্চ ৫ মেগাবাইট)',
  onExtractedText,
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedSnippet, setExtractedSnippet] = useState<string | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [isApplied, setIsApplied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const handleFileChange = (selectedFile: File) => {
    const validMimes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validMimes.includes(selectedFile.type.toLowerCase())) {
      setError('অনুগ্রহ করে সঠিক ফরম্যাটের ছবি আপলোড করুন (PNG, JPG বা WebP)।');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে। অনুগ্রহ করে ছোট ছবি আপলোড করুন।');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setFile(selectedFile);
    setError(null);
    setExtractedSnippet(null);
    setEditableText('');
    setIsApplied(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Auto extract OCR
    performOcr(selectedFile);
  };

  const performOcr = async (imageFile: File) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    try {
      const result = await api.extractScreenshot(imageFile, { signal: controller.signal });
      if (currentId !== requestIdRef.current) return;
      setExtractedSnippet(result.extracted_text);
      setEditableText(result.extracted_text);
      onExtractedText(result.extracted_text);
      setIsApplied(true);
    } catch (err: unknown) {
      if (currentId !== requestIdRef.current) return;
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('বাতিল'))) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'স্ক্রিনশট থেকে টেক্সট এক্সট্রাকশন ব্যর্থ হয়েছে।';
      setError(msg);
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExtractedSnippet(null);
    setEditableText('');
    setError(null);
    setIsApplied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyEditedText = () => {
    onExtractedText(editableText);
    setIsApplied(true);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
          <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </label>
        {file && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-rose-950/20 focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="আপলোড করা স্ক্রিনশট মুছে ফেলুন"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>মুছে ফেলুন</span>
          </button>
        )}
      </div>

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          className="border border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-4 sm:p-5 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label="স্ক্রিনশট আপলোড ড্রপজোন"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 group-hover:text-teal-400 group-hover:bg-teal-500/10 flex items-center justify-center mx-auto mb-2 transition-colors">
            <Upload className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white font-sans">
            স্ক্রিনশট নির্বাচন করতে ক্লিক করুন বা টেনে আনুন
          </p>
          <p className="text-xs text-slate-400 mt-1 font-sans">{helperText}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0a1224] p-3 sm:p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Uploaded Screenshot preview"
                className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
              />
            )}
            <div className="flex-grow min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase()}
              </p>
              {loading && (
                <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-teal-400 mt-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>AI OCR দিয়ে টেক্সট পড়া হচ্ছে...</span>
                </div>
              )}
              {isApplied && !loading && (
                <div className="flex items-center gap-1 text-xs text-teal-300 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>টেক্সট ইনপুটে যুক্ত হয়েছে</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 min-h-[36px]"
              >
                ছবি পরিবর্তন
              </button>
              <button
                type="button"
                onClick={() => performOcr(file)}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors border border-slate-700 focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="পুনরায় OCR করুন"
                aria-label="পুনরায় OCR টেক্সট রিড করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Editable OCR text preview with confirm-before-analysis button */}
          {extractedSnippet && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-mono text-[11px] text-teal-300">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>OCR এক্সট্রাক্ট করা টেক্সট (প্রয়োজনে সংশোধন করুন):</span>
                </span>
                <button
                  type="button"
                  onClick={handleApplyEditedText}
                  className="text-teal-400 hover:text-teal-300 font-bold underline text-xs focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
                >
                  ইনপুটে প্রয়োগ করুন
                </button>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => {
                  setEditableText(e.target.value);
                  setIsApplied(false);
                }}
                rows={3}
                aria-label="OCR থেকে প্রাপ্ত টেক্সট সম্পাদনা করুন"
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400"
                placeholder="এক্সট্রাক্ট করা টেক্সট..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
