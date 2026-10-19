import React, { useState } from 'react';
import {
  Copy,
  Check,
  Search,
  Sliders,
  Sparkles,
  Trophy,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PI_DECIMALS, FULL_PI_STRING, TOTAL_DECIMAL_DIGITS } from '../data/piData';
import { useAuth } from '../context/AuthContext';
import type { AppTab } from '../types';

interface DigitsReferenceViewProps {
  onNavigateTab: (tab: AppTab) => void;
  onSelectChunkForPractice?: (chunkIndex: number) => void;
}

export const DigitsReferenceView: React.FC<DigitsReferenceViewProps> = ({
  onNavigateTab,
  onSelectChunkForPractice,
}) => {
  const { stats } = useAuth();
  const [copied, setCopied] = useState(false);
  const [chunkGroupSize, setChunkGroupSize] = useState<number>(10);
  const [searchPos, setSearchPos] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_PI_STRING);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJumpToDigit = (e: React.FormEvent) => {
    e.preventDefault();
    const pos = parseInt(searchPos, 10);
    if (!isNaN(pos) && pos >= 1 && pos <= TOTAL_DECIMAL_DIGITS) {
      setHighlightedIndex(pos - 1);
      const el = document.getElementById(`digit-${pos - 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Group decimals into rows of 50 digits (each row containing 5 blocks of 10 digits)
  const rows: { rowIndex: number; startDigit: number; endDigit: number; text: string }[] = [];
  const digitsPerRow = 50;

  for (let i = 0; i < PI_DECIMALS.length; i += digitsPerRow) {
    rows.push({
      rowIndex: Math.floor(i / digitsPerRow),
      startDigit: i + 1,
      endDigit: Math.min(i + digitsPerRow, PI_DECIMALS.length),
      text: PI_DECIMALS.slice(i, i + digitsPerRow),
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Referensi 1.000 Digit Pi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tersimpan Permanen
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deretan angka tersimpan lengkap di dalam website ini untuk referensi hafalan kapan saja.
          </p>
        </div>

        {/* Copy & Search Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleJumpToDigit} className="flex items-center">
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1000"
                value={searchPos}
                onChange={(e) => setSearchPos(e.target.value)}
                placeholder="Cari digit ke- (1-1000)..."
                className="w-48 bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </form>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/80 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Salin Semua (1000)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Progress Highlight Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Batas Rekor Hafalanmu Saat Ini</p>
            <p className="text-base font-bold text-white">
              <span className="text-emerald-400">{stats.bestScore}</span> dari 1.000 digit dihafal (
              {((stats.bestScore / 1000) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('practice')}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Uji Hafalan Sekarang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Digits Board */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-3">
        {/* Leading 3. indicator */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div className="font-mono-num text-xl font-bold text-indigo-400">
            Nilai Pi = 3.
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              Sudah Pernah Dihafal ({stats.bestScore} digit)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
              Belum Dihafal
            </span>
          </div>
        </div>

        {/* Rows of 50 digits */}
        <div className="space-y-2.5 font-mono-num text-sm sm:text-base leading-relaxed">
          {rows.map((row) => (
            <div
              key={row.rowIndex}
              className="p-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 transition flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              {/* Row range badge */}
              <div className="shrink-0 w-28 text-xs font-sans font-medium text-slate-500 select-none">
                Digit {row.startDigit.toString().padStart(4, ' ')}–{row.endDigit.toString().padStart(4, ' ')}:
              </div>

              {/* Digits chunks */}
              <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 tracking-wider">
                {/* Divide the 50 digits into 5 chunks of 10 digits */}
                {Array.from({ length: 5 }).map((_, chunkIdxInRow) => {
                  const chunkStart = chunkIdxInRow * 10;
                  const chunkStr = row.text.slice(chunkStart, chunkStart + 10);
                  const globalChunkIdx = row.rowIndex * 5 + chunkIdxInRow;

                  return (
                    <span
                      key={chunkIdxInRow}
                      onClick={() => {
                        if (onSelectChunkForPractice) {
                          onSelectChunkForPractice(globalChunkIdx);
                          onNavigateTab('train_chunks');
                        }
                      }}
                      title="Klik untuk melatih blok 10 digit ini"
                      className="px-1.5 py-0.5 rounded-lg hover:bg-indigo-950/60 hover:text-indigo-200 cursor-pointer transition select-all"
                    >
                      {chunkStr.split('').map((digit, charIdx) => {
                        const globalDigitIndex = row.startDigit - 1 + chunkStart + charIdx;
                        const isMemorized = globalDigitIndex < stats.bestScore;
                        const isSearched = highlightedIndex === globalDigitIndex;

                        return (
                          <span
                            key={charIdx}
                            id={`digit-${globalDigitIndex}`}
                            className={`${
                              isSearched
                                ? 'bg-amber-400 text-slate-950 font-extrabold px-0.5 rounded ring-2 ring-amber-400'
                                : isMemorized
                                ? 'text-emerald-400 font-semibold'
                                : 'text-slate-400'
                            }`}
                          >
                            {digit}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
