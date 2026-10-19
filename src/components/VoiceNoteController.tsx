import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  AlertCircle,
  Volume2,
  Sparkles,
  Languages,
  HelpCircle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VoiceNoteControllerProps {
  isListening: boolean;
  isSupported: boolean;
  onToggleListening: () => void;
  lastTranscript: string;
  errorMessage: string | null;
  lang: string;
  onLanguageChange: (lang: string) => void;
  disabled?: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
}

export const VoiceNoteController: React.FC<VoiceNoteControllerProps> = ({
  isListening,
  isSupported,
  onToggleListening,
  lastTranscript,
  errorMessage,
  lang,
  onLanguageChange,
  disabled = false,
  audioLevel = 0,
  isSpeaking = false,
}) => {
  const [showGuide, setShowGuide] = useState<boolean>(false);
  if (!isSupported) {
    return (
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 flex items-center gap-3 text-xs text-amber-300">
        <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold text-amber-200">Mode Suara Tidak Didukung di Browser Ini</p>
          <p className="text-amber-300/80 mt-0.5">
            Gunakan browser Google Chrome atau Microsoft Edge untuk menikmati fitur stor hafalan lewat suara.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
        isListening
          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Mic toggle & status */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onToggleListening}
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 ring-4 ring-rose-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95'
            }`}
            title={isListening ? 'Hentikan Mendengar' : 'Mulai Rekam Suara Hafalan'}
          >
            {isListening ? (
              <>
                <Mic className="w-6 h-6 animate-pulse" />
                {/* Glowing ripple wave */}
                <span className="absolute inset-0 rounded-2xl ring-2 ring-rose-400 animate-ping opacity-30" />
              </>
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white">
                {isListening ? '🎙️ Mode Suara Aktif (Mendengarkan)' : 'Mode Suara (Voice Note)'}
              </span>
              {isListening && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  LIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {isListening ? (
                isSpeaking ? (
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Mendengar suaramu... Terus sebutkan angka!
                  </span>
                ) : (
                  <span className="text-indigo-300/90 font-medium">
                    ⏳ Jeda aman aktif: Berhenti sejenak untuk mengingat tidak masalah, lanjutkan bicara kapan saja!
                  </span>
                )
              ) : (
                'Tekan mikrofon untuk stor hafalan tanpa perlu mengetik keyboard'
              )}
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform Animation & Language Selector */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Animated sound wave bars reacting to user's real voice level */}
          {isListening && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 rounded-xl border border-indigo-500/30">
              <div className="flex items-end gap-1 h-6">
                <span
                  className="w-1 bg-indigo-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(20, Math.min(100, audioLevel * 1.5))}%` }}
                />
                <span
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(30, Math.min(100, audioLevel * 2.2))}%` }}
                />
                <span
                  className="w-1 bg-indigo-300 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(40, Math.min(100, audioLevel * 1.8))}%` }}
                />
                <span
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(25, Math.min(100, audioLevel * 2.0))}%` }}
                />
                <span
                  className="w-1 bg-indigo-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(15, Math.min(100, audioLevel * 1.3))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono-num font-semibold text-emerald-400">
                {audioLevel > 10 ? 'Sensitif' : 'Standby'}
              </span>
            </div>
          )}

          {/* Language selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lang}
              disabled={isListening}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="id-ID" className="bg-slate-900 text-white">
                Bahasa Indonesia
              </option>
              <option value="en-US" className="bg-slate-900 text-white">
                English
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Spoken words live transcript feedback & pause state indicator */}
      {isListening && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-start justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-500 font-medium shrink-0">Suara terdeteksi:</span>
            {lastTranscript ? (
              <span className="font-mono-num text-indigo-300 italic truncate max-w-full">
                &ldquo;{lastTranscript}&rdquo;
              </span>
            ) : (
              <span className="text-slate-400 italic">
                {isSpeaking ? 'Mendeteksi suara...' : 'Menunggu suaramu... (jeda aman)'}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            Auto-Resume Aktif
          </span>
        </div>
      )}

      {/* Error alert if mic was blocked */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Klik tombol panduan di bawah untuk melihat langkah mudah mengaktifkan izin mikrofon di browser Anda.
          </p>
        </div>
      )}

      {/* Guide toggle button */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Cara Mengizinkan Akses Mikrofon</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[11px] text-slate-500">
          Privasi: Suara diproses langsung di browser Anda
        </span>
      </div>

      {/* Guide Content Accordion */}
      {showGuide && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Langkah Mengizinkan Mikrofon di Browser:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            {/* Desktop Guide */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-1.5">
              <span className="font-bold text-white flex items-center gap-1">
                💻 Google Chrome / Edge (Laptop & PC)
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Lihat ke <strong>kolom URL / address bar</strong> di bagian atas.</li>
                <li>Klik ikon <strong>Gembok (🔒)</strong> atau ikon setelan di sebelah kiri link.</li>
                <li>Ubah setelan <strong>Mikrofon (Microphone)</strong> menjadi <strong>&quot;Izinkan&quot; / &quot;Allow&quot;</strong>.</li>
                <li>Muat ulang (refresh) halaman lalu tekan tombol mikrofon kembali.</li>
              </ol>
            </div>

            {/* Mobile Guide */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-1.5">
              <span className="font-bold text-white flex items-center gap-1">
                📱 HP Android / Ponsel
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Klik tombol <strong>titik tiga (⋮)</strong> di pojok kanan atas browser.</li>
                <li>Pilih <strong>Setelan (Settings)</strong> &gt; <strong>Setelan Situs (Site settings)</strong>.</li>
                <li>Pilih <strong>Mikrofon</strong>, lalu pastikan statusnya <strong>Diizinkan</strong> untuk website ini.</li>
              </ol>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Jika jendela browser menanyakan pop-up izin, pilih <strong>&quot;Allow while visiting the site&quot;</strong>.</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
            >
              Muat Ulang Halaman (F5)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
