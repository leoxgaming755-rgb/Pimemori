import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Zap,
  Clock,
  Eye,
  Trophy,
  CheckCircle2,
  XCircle,
  Keyboard,
  Share2,
  ChevronRight,
  Flame,
  Volume2,
  AlertTriangle,
  Mic,
} from 'lucide-react';
import { PI_DECIMALS, TOTAL_DECIMAL_DIGITS, MILESTONES } from '../data/piData';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';
import { Keypad } from './Keypad';
import { VoiceNoteController } from './VoiceNoteController';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AppTab } from '../types';

interface FullTestViewProps {
  onNavigateTab: (tab: AppTab) => void;
  onSelectChunkForPractice?: (chunkIndex: number) => void;
}

export const FullTestView: React.FC<FullTestViewProps> = ({
  onNavigateTab,
  onSelectChunkForPractice,
}) => {
  const { stats, recordSession, user } = useAuth();

  // Test state
  const [typedDigits, setTypedDigits] = useState<string>('');
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [isStrictStopMode, setIsStrictStopMode] = useState<boolean>(true); // Stop on first error
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [lastMistakeInfo, setLastMistakeInfo] = useState<{
    index: number;
    expected: string;
    actual: string;
  } | null>(null);

  // Timer & Metrics
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [newBestCelebrated, setNewBestCelebrated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Voice Note state
  const [speechLang, setSpeechLang] = useState<string>('id-ID');
  const [showVoiceMode, setShowVoiceMode] = useState<boolean>(true);

  // Hidden input ref for capturing mobile soft keyboard
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const tapeEndRef = useRef<HTMLSpanElement>(null);

  // Auto scroll typed digits tape to the right
  useEffect(() => {
    if (tapeEndRef.current) {
      tapeEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }
  }, [typedDigits]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (startTime && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, isFinished]);

  // End session handler
  const finishSession = useCallback(
    async (finalDigits: string, mistake?: { index: number; expected: string; actual: string }) => {
      setIsFinished(true);
      const score = finalDigits.length;
      const duration = elapsedSeconds > 0 ? elapsedSeconds : Math.max(1, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      const totalAttempts = score + (mistake ? 1 : 0);
      const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 100;

      setIsSaving(true);
      try {
        const { isNewRecord } = await recordSession({
          score,
          totalAttempted: totalAttempts,
          accuracy,
          durationSeconds: duration,
          mode: 'full_test',
          targetChunk: 'all',
          firstMistakeIndex: mistake ? mistake.index : -1,
        });

        if (isNewRecord && score > 0) {
          setNewBestCelebrated(true);
          sounds.playVictory();
          fireCelebration();
        }
      } catch (err) {
        console.error('Error recording session:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [elapsedSeconds, startTime, recordSession]
  );

  // Voice Grace & Mistake Protection state
  const [voiceGraceWarning, setVoiceGraceWarning] = useState<{
    misheard: string;
    expected: string;
  } | null>(null);
  const voiceGraceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle digit input (from keyboard, keypad, or voice note)
  const handleDigitInput = useCallback(
    (digit: string, isFromVoice: boolean = false) => {
      if (isFinished) return;
      if (!/^[0-9]$/.test(digit)) return;

      const currentIndex = typedDigits.length;
      if (currentIndex >= TOTAL_DECIMAL_DIGITS) return;

      // If at the very start (0 digits typed) and user inputs '3', acknowledge prefix "3." without penalizing
      if (currentIndex === 0 && digit === '3') {
        sounds.playCorrect(0);
        return;
      }

      // Start timer on first digit
      if (!startTime) {
        setStartTime(Date.now());
      }

      const expectedDigit = PI_DECIMALS[currentIndex];

      if (digit === expectedDigit) {
        // Clear any pending voice grace warning if user spoke correctly!
        if (voiceGraceTimeoutRef.current) {
          clearTimeout(voiceGraceTimeoutRef.current);
          voiceGraceTimeoutRef.current = null;
        }
        setVoiceGraceWarning(null);

        // Correct digit!
        sounds.playCorrect(typedDigits.length);
        const nextTyped = typedDigits + digit;
        setTypedDigits(nextTyped);
        setShowHint(false);

        // Check if reached personal best during run
        if (nextTyped.length === stats.bestScore + 1 && stats.bestScore > 5) {
          sounds.playVictory();
        }

        // Check if all 1000 digits completed!
        if (nextTyped.length === TOTAL_DECIMAL_DIGITS) {
          finishSession(nextTyped);
        }
      } else {
        // If from voice in strict mode, prevent false mistakes by giving a 1.2s retry window
        if (isFromVoice && isStrictStopMode) {
          if (!voiceGraceTimeoutRef.current) {
            sounds.playError();
            const mistakeData = {
              index: currentIndex,
              expected: expectedDigit,
              actual: digit,
            };
            setVoiceGraceWarning({ misheard: digit, expected: expectedDigit });
            voiceGraceTimeoutRef.current = setTimeout(() => {
              setVoiceGraceWarning(null);
              voiceGraceTimeoutRef.current = null;
              setLastMistakeInfo(mistakeData);
              setMistakesCount((c) => c + 1);
              finishSession(typedDigits, mistakeData);
            }, 1200);
            return;
          }
        }

        // Incorrect digit!
        sounds.playError();
        const mistakeData = {
          index: currentIndex,
          expected: expectedDigit,
          actual: digit,
        };
        setLastMistakeInfo(mistakeData);
        setMistakesCount((c) => c + 1);

        if (isStrictStopMode) {
          // Strict test mode: stop immediately on first mistake
          finishSession(typedDigits, mistakeData);
        }
      }
    },
    [isFinished, typedDigits, startTime, isStrictStopMode, finishSession, stats.bestScore]
  );

  // Speech Recognition Hook with target digit intelligence
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
    onDigit: (digit) => handleDigitInput(digit, true),
    getExpectedDigit: () => PI_DECIMALS[typedDigits.length],
    lang: speechLang,
    enabled: true,
  });

  // Automatically halt speech recognition when test finishes or error occurs
  useEffect(() => {
    if (isFinished && isListening) {
      stopListening();
    }
  }, [isFinished, isListening, stopListening]);

  // Reset test
  const resetTest = useCallback(() => {
    if (voiceGraceTimeoutRef.current) {
      clearTimeout(voiceGraceTimeoutRef.current);
      voiceGraceTimeoutRef.current = null;
    }
    setVoiceGraceWarning(null);
    setTypedDigits('');
    setMistakesCount(0);
    setIsFinished(false);
    setLastMistakeInfo(null);
    setStartTime(null);
    setElapsedSeconds(0);
    setShowHint(false);
    setNewBestCelebrated(false);
    resetSpeechBuffer();
  }, [resetSpeechBuffer]);

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isFinished) {
        resetTest();
      }
      startListening();
    }
  }, [isListening, isFinished, stopListening, resetTest, startListening]);

  const handleBackspace = useCallback(() => {
    if (isFinished || isStrictStopMode) return;
    if (typedDigits.length > 0) {
      setTypedDigits((prev) => prev.slice(0, -1));
    }
  }, [isFinished, isStrictStopMode, typedDigits]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is interacting with another input or modal
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') {
        e.preventDefault();
        resetTest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitInput, handleBackspace, resetTest]);

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Digits per minute calculation
  const dpm = elapsedSeconds > 2 ? Math.round((typedDigits.length / elapsedSeconds) * 60) : 0;

  // Active milestone
  const currentMilestone = MILESTONES.slice().reverse().find((m) => typedDigits.length >= m.count);
  const nextMilestone = MILESTONES.find((m) => typedDigits.length < m.count);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stor Hafalan Pi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              1.000 Digit
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Ketik angka langsung dari keyboard atau gunakan tombol angka di layar.
          </p>
        </div>

        {/* Mode & Tools Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setIsStrictStopMode(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                isStrictStopMode
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Berhenti langsung jika salah (Standar Ujian/Stor Hafalan)"
            >
              Mode Ujian Ketat
            </button>
            <button
              onClick={() => setIsStrictStopMode(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                !isStrictStopMode
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bisa backspace dan terus mencoba"
            >
              Mode Bebas
            </button>
          </div>

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

          <button
            onClick={() => setShowKeypad(!showKeypad)}
            title="Tampilkan Keypad di Layar (Cocok untuk HP / Tablet)"
            className={`p-2 rounded-xl border transition cursor-pointer ${
              showKeypad
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Dashboard Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Digits Count */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Digit Benar</span>
            <span className="font-mono-num text-[11px] text-slate-500">
              {typedDigits.length}/1000
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono-num text-white">
              {typedDigits.length}
            </span>
            <span className="text-xs text-indigo-400 font-medium">digit</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (typedDigits.length / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stopwatch Timer */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Waktu</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono-num text-slate-200">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {startTime ? 'Latihan aktif' : 'Mulai saat mengetik atau bicara'}
          </p>
        </div>

        {/* Speed DPM */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Kecepatan</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono-num text-amber-300">
              {dpm}
            </span>
            <span className="text-xs text-slate-400 font-medium">DPM</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Digit per menit</p>
        </div>

        {/* Rekor Terbaik (Personal Best) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Rekor Terbaik</span>
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono-num text-emerald-400">
              {stats.bestScore}
            </span>
            <span className="text-xs text-slate-400 font-medium">digit</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {typedDigits.length > stats.bestScore
              ? '🔥 Rekor baru terlampaui!'
              : stats.bestScore > 0
              ? `Tersisa ${Math.max(0, stats.bestScore - typedDigits.length)} lagi`
              : 'Mulai buat rekor'}
          </p>
        </div>
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
          disabled={isFinished}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Main Focus Typing Arena */}
      <div className="relative rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-sm min-h-[260px] flex flex-col justify-between">
        {/* Subtle Watermark */}
        <div className="absolute right-6 top-6 text-slate-800/40 text-7xl font-serif select-none pointer-events-none">
          π
        </div>

        {/* Digits Display Tape */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Area Pengetikan Aktif
            </span>
            <div className="flex items-center gap-2">
              {nextMilestone && (
                <span className="text-slate-400">
                  Target berikutnya: <strong className="text-slate-200">{nextMilestone.count} digit</strong> ({nextMilestone.badge})
                </span>
              )}
            </div>
          </div>

          {/* Voice Grace Warning Shield */}
          {voiceGraceWarning && (
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/60 shadow-lg flex items-center justify-between text-xs text-amber-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Mikrofon mendengar <strong className="text-white font-mono-num text-sm bg-amber-900/60 px-1.5 py-0.5 rounded">&ldquo;{voiceGraceWarning.misheard}&rdquo;</strong>.
                  Ucapkan ulang angka ini jika mikrofon salah tangkap!
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-400 animate-pulse">
                Ulangi segera...
              </span>
            </div>
          )}

          <div
            ref={inputContainerRef}
            className="w-full min-h-[130px] p-4 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 font-mono-num text-2xl sm:text-3xl md:text-4xl tracking-wider leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-inner focus:outline-none"
          >
            {/* Pi prefix */}
            <span className="text-slate-500 select-none font-bold">3.</span>

            {/* Render typed digits with subtle chunk separators */}
            {typedDigits.split('').map((char, index) => {
              const isChunkBoundary = (index + 1) % 5 === 0 && index + 1 !== typedDigits.length;
              return (
                <React.Fragment key={index}>
                  <span className="text-emerald-400 font-bold transition-all duration-100">
                    {char}
                  </span>
                  {isChunkBoundary && (
                    <span className="text-slate-700 mx-1 select-none font-normal text-xl sm:text-2xl">
                      &nbsp;
                    </span>
                  )}
                </React.Fragment>
              );
            })}

            {/* Blinking Cursor & Next digit placeholder */}
            {!isFinished && (
              <span className="inline-flex items-center">
                <span className="inline-block w-2.5 h-7 sm:h-8 bg-indigo-500 rounded-sm animate-pulse ml-0.5 shadow-sm shadow-indigo-500" />
                {showHint && (
                  <span className="text-amber-400/80 font-bold ml-1 animate-bounce text-2xl">
                    ({PI_DECIMALS[typedDigits.length]})
                  </span>
                )}
              </span>
            )}

            {/* Empty state prompt */}
            {typedDigits.length === 0 && !isFinished && (
              <span className="text-slate-600 text-lg sm:text-xl font-normal ml-2 select-none">
                Ketik digit pertama setelah koma (misal: 1 4 1 5 ...)
              </span>
            )}
            <span ref={tapeEndRef} />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={resetTest}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition active:scale-95 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Mulai Ulang (R)</span>
            </button>

            {!isStrictStopMode && (
              <button
                onClick={() => setShowHint(true)}
                disabled={isFinished || typedDigits.length >= TOTAL_DECIMAL_DIGITS}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 transition cursor-pointer disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Intip Digit (Hint)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            {currentMilestone && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <span>{currentMilestone.badge}</span>
                <span className="font-semibold">{currentMilestone.label}</span>
              </div>
            )}
            <span className="hidden sm:inline">
              Target Hafalan: <strong className="text-slate-300">1000 digit Pi</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Virtual Keypad (Toggleable or Mobile View) */}
      {showKeypad && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="text-center text-xs text-slate-400 mb-2">
            Keypad Layar Sentuh
          </div>
          <Keypad
            onDigitPress={handleDigitInput}
            onBackspace={handleBackspace}
            onReset={resetTest}
            disabled={isFinished}
          />
        </div>
      )}

      {/* Result / Finished Modal */}
      {isFinished && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {lastMistakeInfo ? (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <XCircle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {lastMistakeInfo ? 'Sesi Selesai (Ada Kesalahan)' : 'Sempurna! 1000 Digit Tuntas!'}
                </h2>
                <p className="text-sm text-slate-400">
                  {newBestCelebrated
                    ? '🎉 Luar biasa! Ini adalah rekor hafalan terbaik barumu!'
                    : 'Hasil hafalan telah otomatis tersimpan ke data latihanmu.'}
                </p>
              </div>
            </div>

            {newBestCelebrated && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5" />
                REKOR BARU!
              </span>
            )}
          </div>

          {/* Mistake analysis box */}
          {lastMistakeInfo && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/60 text-sm space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Analisis Titik Kesalahan:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Kesalahan terjadi pada <strong className="text-white">digit ke-{lastMistakeInfo.index + 1}</strong> setelah koma:
              </p>
              <div className="flex items-center gap-4 text-base font-mono-num font-bold">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="text-xs font-sans text-slate-400 font-normal">Angka Sebenarnya:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    {lastMistakeInfo.expected}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="text-xs font-sans text-slate-400 font-normal">Yang Kamu Ketik:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    {lastMistakeInfo.actual}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Skor Dihafal</span>
              <p className="text-2xl font-bold font-mono-num text-indigo-400 mt-0.5">
                {typedDigits.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Durasi</span>
              <p className="text-2xl font-bold font-mono-num text-slate-200 mt-0.5">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Kecepatan (DPM)</span>
              <p className="text-2xl font-bold font-mono-num text-amber-300 mt-0.5">{dpm}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Akurasi</span>
              <p className="text-2xl font-bold font-mono-num text-emerald-400 mt-0.5">
                {typedDigits.length > 0
                  ? Math.round(
                      (typedDigits.length / (typedDigits.length + (lastMistakeInfo ? 1 : 0))) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            {lastMistakeInfo && onSelectChunkForPractice && (
              <button
                onClick={() => {
                  const chunkIdx = Math.floor(lastMistakeInfo.index / 10);
                  onSelectChunkForPractice(chunkIdx);
                  onNavigateTab('train_chunks');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Latih Blok Digit {Math.floor(lastMistakeInfo.index / 10) * 10 + 1}-{Math.floor(lastMistakeInfo.index / 10) * 10 + 10}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onNavigateTab('stats')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
            >
              Lihat Statistik Lengkap
            </button>

            <button
              onClick={resetTest}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Coba Lagi Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
