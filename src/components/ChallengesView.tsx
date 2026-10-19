import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  EyeOff,
  Zap,
  RotateCcw,
  Trophy,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Mic,
  Keyboard,
} from 'lucide-react';
import { PI_DECIMALS } from '../data/piData';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';
import { Keypad } from './Keypad';
import { VoiceNoteController } from './VoiceNoteController';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AppTab } from '../types';

interface ChallengesViewProps {
  onNavigateTab: (tab: AppTab) => void;
}

type ChallengeType = 'time_attack_60' | 'blindfolded' | 'speedrun_50';

export const ChallengesView: React.FC<ChallengesViewProps> = ({ onNavigateTab }) => {
  const { stats, recordSession } = useAuth();

  // Active challenge type
  const [activeChallenge, setActiveChallenge] = useState<ChallengeType>('time_attack_60');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [typedDigits, setTypedDigits] = useState<string>('');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Time Attack 60s
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);

  // Speedrun Stopwatch
  const [speedrunStart, setSpeedrunStart] = useState<number | null>(null);
  const [speedrunElapsedMs, setSpeedrunElapsedMs] = useState<number>(0);

  // Blindfolded specific
  const [revealedAfterBlindfold, setRevealedAfterBlindfold] = useState<boolean>(false);

  // UI helpers
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [showVoice, setShowVoice] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<string>('id-ID');
  const [personalBestRecords, setPersonalBestRecords] = useState<{
    timeAttack: number;
    blindfolded: number;
    speedrun50: number | null; // in ms
  }>(() => {
    try {
      const saved = localStorage.getItem('pimemory_challenge_pbs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { timeAttack: 0, blindfolded: 0, speedrun50: null };
  });

  const savePB = (type: 'timeAttack' | 'blindfolded' | 'speedrun50', val: number) => {
    setPersonalBestRecords((prev) => {
      const updated = { ...prev, [type]: val };
      localStorage.setItem('pimemory_challenge_pbs', JSON.stringify(updated));
      return updated;
    });
  };

  // Timer interval for Time Attack
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && activeChallenge === 'time_attack_60' && timeLeft > 0 && !isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinish(typedDigits, 'time_up');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, activeChallenge, timeLeft, isFinished, typedDigits]);

  // Stopwatch interval for Speedrun
  useEffect(() => {
    let animFrame: number;
    if (isRunning && activeChallenge === 'speedrun_50' && speedrunStart && !isFinished) {
      const update = () => {
        setSpeedrunElapsedMs(Date.now() - speedrunStart);
        animFrame = requestAnimationFrame(update);
      };
      animFrame = requestAnimationFrame(update);
    }
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isRunning, activeChallenge, speedrunStart, isFinished]);

  // Start test
  const startChallenge = () => {
    setTypedDigits('');
    setIsFinished(false);
    setRevealedAfterBlindfold(false);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setSpeedrunElapsedMs(0);
    setSpeedrunStart(Date.now());
    setIsRunning(true);
  };

  // Reset challenge with shortcut 'r'
  const resetChallenge = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    setTypedDigits('');
    setRevealedAfterBlindfold(false);
    setTimeLeft(60);
    setCombo(0);
    setMaxCombo(0);
    setSpeedrunElapsedMs(0);
    setSpeedrunStart(null);
  }, []);

  // Finish challenge
  const handleFinish = useCallback(
    async (finalDigits: string, reason: 'time_up' | 'mistake' | 'target_reached') => {
      setIsFinished(true);
      setIsRunning(false);
      const score = finalDigits.length;

      if (activeChallenge === 'time_attack_60') {
        if (score > personalBestRecords.timeAttack) {
          savePB('timeAttack', score);
          fireCelebration();
          sounds.playVictory();
        }
        await recordSession({
          score,
          totalAttempted: score + (reason === 'mistake' ? 1 : 0),
          accuracy: 100,
          durationSeconds: 60 - timeLeft,
          mode: 'time_attack_60',
          firstMistakeIndex: reason === 'mistake' ? score : -1,
        });
      } else if (activeChallenge === 'blindfolded') {
        setRevealedAfterBlindfold(true);
        if (score > personalBestRecords.blindfolded) {
          savePB('blindfolded', score);
          fireCelebration();
          sounds.playVictory();
        }
        await recordSession({
          score,
          totalAttempted: score + (reason === 'mistake' ? 1 : 0),
          accuracy: 100,
          durationSeconds: 30,
          mode: 'blindfolded',
          firstMistakeIndex: reason === 'mistake' ? score : -1,
        });
      } else if (activeChallenge === 'speedrun_50') {
        const ms = Date.now() - (speedrunStart || Date.now());
        if (reason === 'target_reached') {
          if (!personalBestRecords.speedrun50 || ms < personalBestRecords.speedrun50) {
            savePB('speedrun50', ms);
            fireCelebration();
            sounds.playVictory();
          }
          await recordSession({
            score: 50,
            totalAttempted: 50,
            accuracy: 100,
            durationSeconds: Math.round(ms / 1000),
            mode: 'speedrun_50',
            firstMistakeIndex: -1,
          });
        }
      }
    },
    [activeChallenge, personalBestRecords, timeLeft, speedrunStart, recordSession]
  );

  // Process input digit
  const handleDigitInput = useCallback(
    (digit: string) => {
      if (isFinished) return;
      if (!isRunning) {
        // Auto start on first digit
        startChallenge();
      }

      const currentIndex = typedDigits.length;
      if (currentIndex >= PI_DECIMALS.length) return;

      const expectedDigit = PI_DECIMALS[currentIndex];
      if (digit === expectedDigit) {
        const nextDigits = typedDigits + digit;
        setTypedDigits(nextDigits);
        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        sounds.playCorrect(newCombo);

        // Speedrun 50 check
        if (activeChallenge === 'speedrun_50' && nextDigits.length >= 50) {
          handleFinish(nextDigits, 'target_reached');
        }
      } else {
        // Mistake!
        sounds.playError();
        handleFinish(typedDigits, 'mistake');
      }
    },
    [isFinished, isRunning, typedDigits, combo, maxCombo, activeChallenge, handleFinish]
  );

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetChallenge();
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetChallenge, handleDigitInput]);

  // Voice note integration
  const {
    isListening,
    isSupported: voiceSupported,
    lastTranscript,
    errorMessage: voiceError,
    audioLevel,
    isSpeaking,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onDigit: (digit) => handleDigitInput(digit),
    getExpectedDigit: () => PI_DECIMALS[typedDigits.length],
    lang: speechLang,
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatMs = (ms: number) => {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    const millis = Math.floor((ms % 1000) / 10);
    return `${min > 0 ? `${min}m ` : ''}${sec.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Zona Tantangan Khusus • Mode Terpisah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tantangan Hafalan & Speedrun
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Uji ketangkasan dan kecepatan ingatanmu dalam arena khusus tanpa mengganggu alur stor hafalan harian normal.
            </p>
          </div>

          {/* Quick PB Badges */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Rekor 60 Detik</span>
              <span className="text-xl font-bold font-mono-num text-amber-400">
                {personalBestRecords.timeAttack} <span className="text-xs text-slate-400">digit</span>
              </span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Rekor Blindfold</span>
              <span className="text-xl font-bold font-mono-num text-purple-400">
                {personalBestRecords.blindfolded} <span className="text-xs text-slate-400">digit</span>
              </span>
            </div>
            {personalBestRecords.speedrun50 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Speedrun 50</span>
                <span className="text-xl font-bold font-mono-num text-emerald-400">
                  {formatMs(personalBestRecords.speedrun50)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Challenge Selection Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Time Attack 60s */}
          <button
            type="button"
            onClick={() => {
              setActiveChallenge('time_attack_60');
              resetChallenge();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeChallenge === 'time_attack_60'
                ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                60 Detik
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Time Attack 60s</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sprint kilat 1 menit. Seberapa banyak digit yang bisa kamu ketik sebelum waktu habis?
            </p>
          </button>

          {/* Card 2: Blindfolded Mode */}
          <button
            type="button"
            onClick={() => {
              setActiveChallenge('blindfolded');
              resetChallenge();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeChallenge === 'blindfolded'
                ? 'bg-purple-500/15 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <EyeOff className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                Layar Tertutup
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Mode Blindfolded</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tantangan tanpa melihat layar! Angka disamarkan; kamu hanya mengandalkan suara & ingatan murni.
            </p>
          </button>

          {/* Card 3: Speedrun 50 */}
          <button
            type="button"
            onClick={() => {
              setActiveChallenge('speedrun_50');
              resetChallenge();
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeChallenge === 'speedrun_50'
                ? 'bg-emerald-500/15 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                Target 50 Digit
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Speedrun 50 Digit</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tembus 50 digit Pi pertama dengan catatan waktu tercepat. Presisi stopwatch milidetik!
            </p>
          </button>
        </div>
      </div>

      {/* Challenge Arena */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative">
        {/* Arena Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-300">
              {activeChallenge === 'time_attack_60' && '⏱️ Sprint Waktu (Countdown 60 Detik)'}
              {activeChallenge === 'blindfolded' && '🙈 Mode Mata Tertutup (Layar Dirahasiakan)'}
              {activeChallenge === 'speedrun_50' && '⚡ Balapan Waktu 50 Digit'}
            </div>
            {isRunning && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                BERLANGSUNG
              </span>
            )}
          </div>

          {/* Controls: Reset (r) & Keypad toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVoice(!showVoice)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showVoice
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showKeypad
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Papan Angka</span>
            </button>

            <button
              type="button"
              onClick={resetChallenge}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Mulai Ulang (R)</span>
            </button>
          </div>
        </div>

        {/* Live Gauges & Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Main Primary Metric */}
          {activeChallenge === 'time_attack_60' ? (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Sisa Waktu</span>
              <div
                className={`text-3xl font-extrabold font-mono-num mt-1 ${
                  timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                }`}
              >
                {timeLeft}s
              </div>
            </div>
          ) : activeChallenge === 'speedrun_50' ? (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Stopwatch</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono-num mt-1 text-emerald-400">
                {formatMs(speedrunElapsedMs)}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Status Visual</span>
              <div className="text-xl font-bold mt-1 text-purple-400 flex items-center gap-1.5">
                <EyeOff className="w-5 h-5" />
                <span>Sensor Buta</span>
              </div>
            </div>
          )}

          {/* Current Digits */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Digit Benar</span>
            <div className="text-3xl font-extrabold font-mono-num mt-1 text-white">
              {typedDigits.length}
              {activeChallenge === 'speedrun_50' && <span className="text-sm text-slate-500 font-normal"> / 50</span>}
            </div>
          </div>

          {/* Combo Multiplier */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Streak Combo</span>
            <div className="text-3xl font-extrabold font-mono-num mt-1 text-orange-400 flex items-center gap-1">
              <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
              <span>{combo}</span>
            </div>
          </div>

          {/* Speed / DPM */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Kecepatan (DPM)</span>
            <div className="text-3xl font-extrabold font-mono-num mt-1 text-indigo-400">
              {activeChallenge === 'time_attack_60'
                ? Math.round((typedDigits.length / Math.max(1, 60 - timeLeft)) * 60)
                : speedrunElapsedMs > 0
                ? Math.round((typedDigits.length / (speedrunElapsedMs / 1000)) * 60)
                : 0}
            </div>
          </div>
        </div>

        {/* Voice Note Controller (if open) */}
        {showVoice && (
          <div className="animate-in fade-in duration-200">
            <VoiceNoteController
              isListening={isListening}
              isSupported={voiceSupported}
              onToggleListening={toggleListening}
              lastTranscript={lastTranscript}
              errorMessage={voiceError}
              lang={speechLang}
              onLanguageChange={setSpeechLang}
              audioLevel={audioLevel}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {/* The Digit Display Arena */}
        <div className="min-h-[160px] bg-slate-950/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Prefix 3. */}
          <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
            Urutan Hafalan (Ketik angka di keyboard atau tekan papan)
          </div>

          {activeChallenge === 'blindfolded' && !revealedAfterBlindfold ? (
            /* Blindfolded Mask */
            <div className="py-6 space-y-3">
              <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-lg">
                {typedDigits.length === 0 ? (
                  <span className="text-slate-600 italic text-base">
                    Mulai ketik angka pertama (misal: 1, 4, 1, 5...)... Layar akan tetap dirahasiakan!
                  </span>
                ) : (
                  typedDigits.split('').map((_, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full bg-purple-500/70 shadow-sm shadow-purple-500/50 animate-pulse inline-block"
                    />
                  ))
                )}
              </div>
              <p className="text-xs text-purple-300/80 font-medium">
                🙈 Sensor blindfold aktif: Suara tinggi = benar, suara rendah = salah. Total digit tersimpan:{' '}
                <strong className="text-white font-mono-num">{typedDigits.length}</strong>
              </p>
            </div>
          ) : (
            /* Normal Digit Stream with 3. prefix */
            <div className="flex items-center flex-wrap justify-center gap-1 max-w-3xl font-mono-num text-2xl sm:text-3xl font-bold">
              <span className="text-indigo-400">3.</span>
              {typedDigits.length === 0 ? (
                <span className="text-slate-600 text-lg font-sans font-normal italic animate-pulse">
                  Tekan angka pertama untuk memulai timer...
                </span>
              ) : (
                typedDigits.split('').map((char, index) => (
                  <span
                    key={index}
                    className="text-emerald-400 transition-all duration-150 inline-block px-0.5"
                  >
                    {char}
                  </span>
                ))
              )}
              {/* Blinking cursor */}
              {!isFinished && (
                <span className="w-2.5 h-7 bg-indigo-500 rounded-sm animate-pulse inline-block ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Completion Modal / Result Overlay */}
        {isFinished && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/50 border border-indigo-500/40 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex p-3 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Tantangan Selesai!</h3>
              <p className="text-sm text-slate-300">
                {activeChallenge === 'time_attack_60' &&
                  `Waktu 60 detik habis! Kamu sukses menghafal ${typedDigits.length} digit tanpa salah!`}
                {activeChallenge === 'blindfolded' &&
                  `Tirai blindfold dibuka! Kamu berhasil menebak ${typedDigits.length} digit murni dari daya ingat!`}
                {activeChallenge === 'speedrun_50' &&
                  `Hebat! 50 digit Pi pertama terselesaikan dalam ${formatMs(speedrunElapsedMs)}!`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={startChallenge}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Lagi (Tekan R)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('practice')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                Kembali ke Stor Hafalan
              </button>
            </div>
          </div>
        )}

        {/* Virtual Keypad for Mobile or Touch */}
        {showKeypad && (
          <div className="pt-2 border-t border-slate-800/80">
            <Keypad
              onDigitPress={handleDigitInput}
              onBackspace={() => {
                if (typedDigits.length > 0) {
                  setTypedDigits((prev) => prev.slice(0, -1));
                }
              }}
              onReset={resetChallenge}
              disabled={isFinished}
            />
          </div>
        )}
      </div>
    </div>
  );
};
