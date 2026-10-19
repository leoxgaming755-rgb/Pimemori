import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HelpCircle,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  ChevronRight,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import { PI_DECIMALS, PI_CHUNKS_OF_10 } from '../data/piData';
import { sounds } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';
import type { AppTab } from '../types';

interface PracticeQuizAudioViewProps {
  onNavigateTab: (tab: AppTab) => void;
  onSelectChunkForPractice: (chunkIndex: number) => void;
}

export const PracticeQuizAudioView: React.FC<PracticeQuizAudioViewProps> = ({
  onNavigateTab,
  onSelectChunkForPractice,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'quiz' | 'audio_reader'>('quiz');

  // --- QUIZ STATE ---
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<{
    pos: number;
    prefix: string;
    target: string;
    options: string[];
    answered: boolean;
    selectedOption: string | null;
    isCorrect: boolean | null;
  } | null>(null);

  const generateQuestion = useCallback(() => {
    // Pick a random position between 0 and 990
    const pos = Math.floor(Math.random() * 980);
    const prefixLen = 5;
    const targetLen = 5;

    const prefix =
      pos === 0
        ? '3.' + PI_DECIMALS.slice(0, prefixLen)
        : '...' + PI_DECIMALS.slice(Math.max(0, pos - prefixLen), pos);

    const target = PI_DECIMALS.slice(pos, pos + targetLen);

    // Generate 3 fake options with random digits
    const optionsSet = new Set<string>();
    optionsSet.add(target);

    while (optionsSet.size < 4) {
      let fake = '';
      for (let i = 0; i < targetLen; i++) {
        fake += Math.floor(Math.random() * 10).toString();
      }
      if (fake !== target) {
        optionsSet.add(fake);
      }
    }

    // Shuffle options
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      pos,
      prefix,
      target,
      options,
      answered: false,
      selectedOption: null,
      isCorrect: null,
    });
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion || currentQuestion.answered) return;

    const isCorrect = option === currentQuestion.target;
    if (isCorrect) {
      sounds.playCorrect(quizStreak + 1);
      setQuizScore((prev) => prev + 1);
      setQuizStreak((prev) => prev + 1);
      if ((quizStreak + 1) % 5 === 0) {
        fireCelebration();
      }
    } else {
      sounds.playError();
      setQuizStreak(0);
    }

    setCurrentQuestion((prev) =>
      prev
        ? {
            ...prev,
            answered: true,
            selectedOption: option,
            isCorrect,
          }
        : null
    );
  };

  // --- AUDIO READER STATE ---
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [audioRangeStart, setAudioRangeStart] = useState<number>(0); // 0..900
  const [audioCurrentIndex, setAudioCurrentIndex] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const cancelAudioRef = useRef<boolean>(false);

  // Stop audio speech
  const stopAudioReader = useCallback(() => {
    cancelAudioRef.current = true;
    setIsPlayingAudio(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudioReader();
    };
  }, [stopAudioReader]);

  const speakDigit = (text: string, rate: number): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const startAudioReader = async () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Web Speech Audio.');
      return;
    }

    cancelAudioRef.current = false;
    setIsPlayingAudio(true);

    const rate = audioSpeed === 'slow' ? 0.75 : audioSpeed === 'normal' ? 1.0 : 1.3;
    const delayMs = audioSpeed === 'slow' ? 300 : audioSpeed === 'normal' ? 180 : 80;

    const totalToRead = 50; // read 50 digits per batch
    const endIndex = Math.min(PI_DECIMALS.length, audioRangeStart + totalToRead);

    do {
      for (let i = audioRangeStart; i < endIndex; i++) {
        if (cancelAudioRef.current) break;
        setAudioCurrentIndex(i);

        const digitChar = PI_DECIMALS[i];
        await speakDigit(digitChar, rate);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } while (isLooping && !cancelAudioRef.current);

    setIsPlayingAudio(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950/40 via-indigo-950/40 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Latihan Pelengkap & Auditori</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kuis Tebak Lanjutan & Dikte Audio Pi
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Asah daya ingatmu dari sudut pandang berbeda: Uji memori acak dengan kuis tebak kelanjutan angka,
              atau dengarkan ritme pembacaan audio otomatis saat istirahat santai.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                stopAudioReader();
                setActiveSubMode('quiz');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubMode === 'quiz'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Kuis Tebak Digit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubMode('audio_reader')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubMode === 'audio_reader'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-teal-300" />
              <span>Dikte Audio Pi</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubMode === 'quiz' ? (
        /* QUIZ MODE INTERFACE */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Quiz Stats Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-300">
                Tebak 5 Digit Berikutnya Setelah Urutan Ini:
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold font-mono-num">
              <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>Streak: {quizStreak}</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Benar: {quizScore}</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div className="space-y-6">
              <div className="p-8 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  Mulai dari digit ke-{currentQuestion.pos + 1}
                </span>
                <div className="text-2xl sm:text-4xl font-extrabold font-mono-num text-white tracking-widest flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-slate-400">{currentQuestion.prefix}</span>
                  <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse">
                    ? ? ? ? ?
                  </span>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, i) => {
                  const isChosen = currentQuestion.selectedOption === opt;
                  const isRightTarget = opt === currentQuestion.target;

                  let style =
                    'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-white';
                  if (currentQuestion.answered) {
                    if (isRightTarget) {
                      style =
                        'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40';
                    } else if (isChosen) {
                      style = 'bg-rose-600/30 border-rose-500 text-rose-200';
                    } else {
                      style = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={currentQuestion.answered}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`p-4 rounded-2xl border text-center font-mono-num font-bold text-xl sm:text-2xl transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Next Button */}
              {currentQuestion.answered && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    {currentQuestion.isCorrect ? (
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <XCircle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white">
                        {currentQuestion.isCorrect ? 'Jawaban Benar! 🎉' : 'Kurang Tepat!'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Digit ke-{currentQuestion.pos + 1} s/d {currentQuestion.pos + 5} adalah{' '}
                        <strong className="text-teal-300 font-mono-num">{currentQuestion.target}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateQuestion}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition cursor-pointer flex items-center gap-2"
                  >
                    <span>Soal Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* AUDIO READER INTERFACE */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-2 border-b border-slate-800/80 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-teal-400" />
              <span>Dikte Audio Pi Otomatis (Metronom Hafalan Auditori)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dengarkan angka Pi dibacakan satu per satu secara berirama. Sangat efektif untuk memperkuat ingatan
              bawah sadar melalui telinga saat sedang beristirahat atau sebelum tidur.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Speed Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Kecepatan Dikte
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['slow', 'normal', 'fast'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setAudioSpeed(spd)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      audioSpeed === spd
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd === 'slow' ? 'Lambat' : spd === 'normal' ? 'Normal' : 'Cepat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Range Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Mulai Dari Digit Ke-
              </span>
              <select
                value={audioRangeStart}
                disabled={isPlayingAudio}
                onChange={(e) => setAudioRangeStart(Number(e.target.value))}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 20 }, (_, idx) => {
                  const start = idx * 50;
                  return (
                    <option key={start} value={start}>
                      Digit {start + 1} s/d {start + 50}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Loop Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                  Putar Berulang (Loop)
                </span>
                <span className="text-xs text-slate-500">Ulangi otomatis tanpa henti</span>
              </div>
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Current Reading Display */}
          <div className="p-8 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-4">
            <span className="text-xs text-slate-400">
              Sedang Dibacakan (Posisi: Digit ke-{audioCurrentIndex + 1})
            </span>
            <div className="text-6xl font-black font-mono-num text-teal-400">
              {isPlayingAudio ? PI_DECIMALS[audioCurrentIndex] : '—'}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {isPlayingAudio ? (
                <button
                  type="button"
                  onClick={stopAudioReader}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  <span>Hentikan Dikte</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startAudioReader}
                  className="px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Mulai Dengarkan Audio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
