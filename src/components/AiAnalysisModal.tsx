import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Trophy, FileText } from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'commentary' | 'press_release';
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  type,
  content,
  isLoading,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCommentary = type === 'commentary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              {isCommentary ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-white tracking-wide uppercase">
                {isCommentary
                  ? 'KOMENTATOR TV · ULASAN TAKTIS PERTANDINGAN'
                  : 'RILIS BERITA PERS OLAHRAGA RESMI'}
              </h2>
              <span className="text-xs text-slate-400">Dihasilkan oleh Google Gemini 3.8 Flash</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Modal AI"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-slate-300 font-semibold font-outfit text-base">
                Gemini sedang menyusun ulasan taktis pertandingan secara real-time...
              </p>
              <span className="text-xs text-slate-500">Menganalisis penguasaan bola, tembakan, dan tempo permainan</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
              {content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold font-outfit transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Buat Ulang (Regenerate)
          </button>

          <button
            onClick={handleCopy}
            disabled={isLoading || !content}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold font-outfit transition flex items-center gap-2 shadow-md shadow-cyan-600/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Teks Berita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
