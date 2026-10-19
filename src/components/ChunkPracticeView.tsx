import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Award,
  Sparkles,
  BookOpen,
  Mic,
} from 'lucide-react';
import { PI_DECIMALS, getPiChunks, type ChunkInfo } from '../data/piData';
import { sounds } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';
import { useAuth } from '../context/AuthContext';
import { Keypad } from './Keypad';
import { VoiceNoteController } from './VoiceNoteController';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ChunkPracticeViewProps {
  initialChunkIndex?: number;
}

export const ChunkPracticeView: React.FC<ChunkPracticeViewProps> = ({
  initialChunkIndex = 0,
}) => {
  const { recordSession } = useAuth();
  const chunks = getPiChunks(10); // 100 chunks of 10 digits = 1000 digits

  const [currentChunkIdx, setCurrentChunkIdx] = useState<number>(initialChunkIndex);
  const [isRevealed, setIsRevealed] = useState<boolean>(true);
  const [typedInput, setTypedInput] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Voice Note state
  const [speechLang, setSpeechLang] = useState<string>('id-ID');
  const [showVoiceMode, setShowVoiceMode] = useState<boolean>(true);

  const activeChunk: ChunkInfo = chunks[currentChunkIdx] || chunks[0];
  const targetDigits = activeChunk.digits;

  // Reset when chunk changes
  useEffect(() => {
    setTypedInput('');
    setIsCompleted(false);
    setIsRevealed(true);
    setAttempts(0);
  }, [currentChunkIdx]);

  const handleDigitInput = useCallback(
    (digit: string) => {
      if (isCompleted || !/^[0-9]$/.test(digit)) return;

      const nextExpected = targetDigits[typedInput.length];
      if (digit === nextExpected) {
        sounds.playCorrect(typedInput.length);
        const nextTyped = typedInput + digit;
        setTypedInput(nextTyped);

        if (nextTyped.length === targetDigits.length) {
          // Chunk finished successfully!
          setIsCompleted(true);
          sounds.playVictory();
          if ((currentChunkIdx + 1) % 5 === 0) {
            fireCelebration();
          }

          // Record chunk practice session
          recordSession({
            score: targetDigits.length,
            totalAttempted: targetDigits.length + attempts,
            accuracy: Math.round((targetDigits.length / (targetDigits.length + attempts)) * 100),
            durationSeconds: 15,
            mode: 'chunk_practice',
            targetChunk: `Digit ${activeChunk.startDigit}-${activeChunk.endDigit}`,
            firstMistakeIndex: -1,
          });
        }
      } else {
        sounds.playError();
        setAttempts((prev) => prev + 1);
      }
    },
    [isCompleted, targetDigits, typedInput, currentChunkIdx, activeChunk, attempts, recordSession]
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!isCompleted && typedInput.length > 0) {
      setTypedInput((prev) => prev.slice(0, -1));
    }
  }, [isCompleted, typedInput]);

  // Speech recognition for chunk practice
  const {
    isSupported: isSpeechSupported,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    resetSpeechBuffer,
    lastTranscript,
    errorMessage: speechError,
    audioLevel,
  } = useSpeechRecognition({
    onDigit: handleDigitInput,
    getExpectedDigit: () => targetDigits[typedInput.length],
    lang: speechLang,
    enabled: true,
  });

  // Stop listening when completed
  useEffect(() => {
    if (isCompleted && isListening) {
      stopListening();
    }
  }, [isCompleted, isListening, stopListening]);

  // Reset when chunk changes
  useEffect(() => {
    setTypedInput('');
    setIsCompleted(false);
    setIsRevealed(true);
    setAttempts(0);
    resetSpeechBuffer();
  }, [currentChunkIdx, resetSpeechBuffer]);

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isCompleted) {
        setTypedInput('');
        setIsCompleted(false);
      }
      startListening();
    }
  }, [isListening, isCompleted, stopListening, startListening]);

  // Listen to physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') {
        e.preventDefault();
        setTypedInput('');
        setIsCompleted(false);
        resetSpeechBuffer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitInput, handleBackspace, resetSpeechBuffer]);

  const goToNextChunk = () => {
    if (currentChunkIdx < chunks.length - 1) {
      setCurrentChunkIdx((c) => c + 1);
    }
  };

  const goToPrevChunk = () => {
    if (currentChunkIdx > 0) {
      setCurrentChunkIdx((c) => c - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Latihan Blok (Chunking)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              10 Digit per Blok
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Teknik juara memori: kuasai 10 digit demi 10 digit hingga tuntas 1000 digit.
          </p>
        </div>

        {/* Chunk selector & voice toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVoiceMode(!showVoiceMode)}
            title="Buka / Tutup Panel Mode Suara (Voice Note)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              isListening
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/20 animate-pulse'
                : showVoiceMode
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Note</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="chunkSelect" className="text-xs text-slate-400">
              Pilih Blok:
            </label>
            <select
              id="chunkSelect"
              value={currentChunkIdx}
              onChange={(e) => setCurrentChunkIdx(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {chunks.map((c) => (
                <option key={c.index} value={c.index}>
                  Blok #{c.index + 1} (Digit {c.startDigit}–{c.endDigit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chunk navigation pill bar */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={goToPrevChunk}
          disabled={currentChunkIdx === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Blok {currentChunkIdx + 1} dari {chunks.length}
          </span>
          <p className="text-sm font-bold text-white">
            Digit ke-{activeChunk.startDigit} s/d {activeChunk.endDigit}
          </p>
        </div>

        <button
          onClick={goToNextChunk}
          disabled={currentChunkIdx === chunks.length - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Note Controller Panel */}
      {showVoiceMode && (
        <VoiceNoteController
          isListening={isListening}
          isSupported={isSpeechSupported}
          onToggleListening={handleToggleVoice}
          lastTranscript={lastTranscript}
          errorMessage={speechError}
          lang={speechLang}
          onLanguageChange={setSpeechLang}
          disabled={isCompleted}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Main Flashcard Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-sm">
        {/* Step 1: Study / Intip Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              1. Pelajari & Hafalkan Angka Ini
            </span>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-indigo-400 transition cursor-pointer"
            >
              {isRevealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Sontekan</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
            {isRevealed ? (
              <div className="font-mono-num text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest text-white flex items-center gap-4">
                <span className="text-indigo-300">{targetDigits.slice(0, 5)}</span>
                <span className="text-slate-600 font-light">•</span>
                <span className="text-indigo-300">{targetDigits.slice(5, 10)}</span>
              </div>
            ) : (
              <div className="py-2 text-slate-500 italic text-sm flex items-center gap-2">
                <span>🔒 Angka disembunyikan untuk melatih ingatan.</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Test Recall Input Box */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              2. Ketik Ulang Dari Ingatanmu ({typedInput.length}/{targetDigits.length})
            </span>
            {attempts > 0 && (
              <span className="text-rose-400 font-medium">{attempts}x salah coba</span>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-center min-h-[90px]">
            <div className="font-mono-num text-3xl sm:text-4xl font-bold tracking-widest flex items-center gap-1">
              {targetDigits.split('').map((char, idx) => {
                const typedChar = typedInput[idx];
                const isCurrentlyActive = idx === typedInput.length;
                return (
                  <span
                    key={idx}
                    className={`w-9 sm:w-11 h-12 sm:h-14 rounded-xl flex items-center justify-center border transition-all ${
                      typedChar
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : isCurrentlyActive
                        ? 'bg-indigo-500/10 border-indigo-500 animate-pulse text-indigo-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {typedChar || (isCurrentlyActive ? '?' : '_')}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Hebat! Blok Ini Berhasil Dikuasai!</p>
                <p className="text-xs text-emerald-300/80">
                  Kamu telah menghafal digit {activeChunk.startDigit}–{activeChunk.endDigit} dengan tepat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setTypedInput('');
                  setIsCompleted(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Ulangi Blok Ini
              </button>
              {currentChunkIdx < chunks.length - 1 && (
                <button
                  onClick={goToNextChunk}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Lanjut Blok Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Keypad toggle & Action */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              setTypedInput('');
              setIsCompleted(false);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Ketikan (R)</span>
          </button>

          <button
            onClick={() => setShowKeypad(!showKeypad)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer font-medium"
          >
            {showKeypad ? 'Sembunyikan Keypad' : 'Tampilkan Keypad Layar'}
          </button>
        </div>

        {showKeypad && (
          <div className="pt-2">
            <Keypad
              onDigitPress={handleDigitInput}
              onBackspace={handleBackspace}
              onReset={() => setTypedInput('')}
              disabled={isCompleted}
            />
          </div>
        )}
      </div>
    </div>
  );
};
