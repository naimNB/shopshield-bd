import React, { useState, useRef } from 'react';
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
  helperText = 'ফেসবুক পোস্ট, চ্যাট বা রসিদের স্ক্রিনশট আপলোড করুন (PNG, JPG, WebP)',
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

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন (PNG, JPG, WebP)।');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে।');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setExtractedSnippet(null);
    setEditableText('');
    setIsApplied(false);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Auto extract OCR
    performOcr(selectedFile);
  };

  const performOcr = async (imageFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.extractScreenshot(imageFile);
      setExtractedSnippet(result.extracted_text);
      setEditableText(result.extracted_text);
      // Auto apply to parent
      onExtractedText(result.extracted_text);
      setIsApplied(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'স্ক্রিনশট থেকে টেক্সট এক্সট্রাকশন ব্যর্থ হয়েছে।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>{label}</span>
        </label>
        {file && (
          <button
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>মুছে ফেলুন</span>
          </button>
        )}
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 sm:p-5 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-white">
            স্ক্রিনশট নির্বাচন করুন বা এখানে টেনে আনুন
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
          <div className="flex items-center gap-3">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Uploaded Screenshot"
                className="w-14 h-14 object-cover rounded-lg border border-slate-800 flex-shrink-0"
              />
            )}
            <div className="flex-grow min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
              <p className="text-[11px] text-slate-400">
                {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase()}
              </p>
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>AI OCR দিয়ে টেক্সট পড়া হচ্ছে...</span>
                </div>
              )}
              {isApplied && !loading && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>টেক্সট ইনপুটে যুক্ত হয়েছে</span>
                </div>
              )}
            </div>

            <button
              onClick={() => performOcr(file)}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
              title="পুনরায় OCR করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Editable OCR text preview */}
          {extractedSnippet && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>OCR এক্সট্রাক্ট করা টেক্সট (প্রয়োজনে সংশোধন করুন):</span>
                </span>
                <button
                  type="button"
                  onClick={handleApplyEditedText}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-xs"
                >
                  টেক্সটে প্রয়োগ করুন
                </button>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => {
                  setEditableText(e.target.value);
                  setIsApplied(false);
                }}
                rows={3}
                className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500/60"
                placeholder="এক্সট্রাক্ট করা টেক্সট..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
