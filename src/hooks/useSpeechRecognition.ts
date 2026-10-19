import { useState, useEffect, useRef, useCallback } from 'react';
import { parseSpeechToDigits, extractDigitsWithExpectedTarget } from '../utils/speechParser';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionOptions {
  onDigit: (digit: string, isFromVoice?: boolean) => void;
  getExpectedDigit?: () => string | undefined;
  lang?: string;
  enabled?: boolean;
}

export function useSpeechRecognition({
  onDigit,
  getExpectedDigit,
  lang = 'id-ID',
  enabled = true,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100 for live mic visualizer

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef<boolean>(false);
  const sessionDispatchedCountRef = useRef<number>(0);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const onDigitRef = useRef(onDigit);
  const getExpectedDigitRef = useRef(getExpectedDigit);

  useEffect(() => {
    onDigitRef.current = onDigit;
  }, [onDigit]);

  useEffect(() => {
    getExpectedDigitRef.current = getExpectedDigit;
  }, [getExpectedDigit]);

  // Audio Analyser for volume feedback
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechAPI) {
        setIsSupported(false);
      }
    }
  }, []);

  // Stop audio visualizer
  const stopAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start live audio level monitor
  const startAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio analyser error:', e);
    }
  }, []);

  // Safe restart helper that resiliently survives browser pauses & silences
  const scheduleRestart = useCallback(() => {
    if (!shouldListenRef.current) return;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    restartTimeoutRef.current = setTimeout(() => {
      if (!shouldListenRef.current) return;
      if (isStartingRef.current) return;

      try {
        if (recognitionRef.current) {
          isStartingRef.current = true;
          recognitionRef.current.start();
        }
      } catch (err) {
        isStartingRef.current = false;
        // If engine is busy transitioning, schedule another retry
        if (shouldListenRef.current) {
          restartTimeoutRef.current = setTimeout(scheduleRestart, 150);
        }
      }
    }, 60);
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    isStartingRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, [stopAudioAnalyser]);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setIsSupported(false);
      setErrorMessage('Browser tidak mendukung Web Speech API. Gunakan Google Chrome atau Edge.');
      return;
    }

    setErrorMessage(null);

    // Request optimized mic stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = stream;
        startAudioAnalyser(stream);
      }
    } catch (mediaErr) {
      console.warn('Microphone permission not granted:', mediaErr);
      setErrorMessage('Izin mikrofon belum diberikan atau diblokir oleh browser.');
      shouldListenRef.current = false;
      setIsListening(false);
      return;
    }

    shouldListenRef.current = true;
    sessionDispatchedCountRef.current = 0;

    try {
      if (!recognitionRef.current) {
        const recognition = new SpeechAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;
        recognition.lang = lang;

        recognition.onstart = () => {
          isStartingRef.current = false;
          setIsListening(true);
          // Crucial: reset session-level dispatched count for each fresh recognition cycle
          sessionDispatchedCountRef.current = 0;
        };

        recognition.onspeechstart = () => {
          setIsSpeaking(true);
        };

        recognition.onspeechend = () => {
          setIsSpeaking(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const currentExpected = getExpectedDigitRef.current ? getExpectedDigitRef.current() : undefined;

          let fullTranscript = '';
          const candidateTranscripts: string[] = [];

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            fullTranscript += res[0].transcript + ' ';

            if (i === event.results.length - 1) {
              for (let alt = 0; alt < res.length; alt++) {
                if (res[alt]?.transcript) {
                  candidateTranscripts.push(res[alt].transcript);
                }
              }
            }
          }

          const trimmed = fullTranscript.trim();
          setLastTranscript(trimmed);

          // Multi-alternative scoring
          const candidateDigits = extractDigitsWithExpectedTarget(candidateTranscripts, currentExpected);
          const fullParsedDigits = parseSpeechToDigits(trimmed);

          const finalDigits = candidateDigits.length > 0 ? candidateDigits : fullParsedDigits;

          // Dispatch newly detected digits in this active session
          if (finalDigits.length > sessionDispatchedCountRef.current) {
            const newDigits = finalDigits.slice(sessionDispatchedCountRef.current);
            sessionDispatchedCountRef.current = finalDigits.length;

            for (const d of newDigits) {
              onDigitRef.current(d, true);
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // 'no-speech' is completely normal when the user pauses or takes a breath!
          // We must NOT stop or display error, just let it seamlessly restart.
          if (event.error === 'no-speech') {
            return;
          }

          if (event.error === 'not-allowed') {
            setErrorMessage('Izin mikrofon ditolak. Klik ikon gembok di address bar untuk mengizinkan mikrofon.');
            shouldListenRef.current = false;
            setIsListening(false);
            stopAudioAnalyser();
          } else if (event.error === 'network') {
            setErrorMessage('Koneksi internet bermasalah untuk pengenalan suara.');
          } else if (event.error === 'aborted') {
            // Aborted is part of pause lifecycle; will automatically restart if shouldListenRef is true
          } else {
            console.warn('Speech recognition warning:', event.error);
          }
        };

        recognition.onend = () => {
          isStartingRef.current = false;
          setIsSpeaking(false);

          // If user still wants to listen, keep UI in active state and restart seamlessly through any pause
          if (shouldListenRef.current) {
            setIsListening(true);
            scheduleRestart();
          } else {
            setIsListening(false);
            stopAudioAnalyser();
          }
        };

        recognitionRef.current = recognition;
      }

      recognitionRef.current.lang = lang;
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (e) {
      isStartingRef.current = false;
      console.error('Failed to start speech recognition:', e);
    }
  }, [lang, scheduleRestart, startAudioAnalyser, stopAudioAnalyser]);

  // Reset buffer on restart
  const resetSpeechBuffer = useCallback(() => {
    sessionDispatchedCountRef.current = 0;
    setLastTranscript('');
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }
  }, [isListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      stopAudioAnalyser();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [stopAudioAnalyser]);

  return {
    isSupported,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    resetSpeechBuffer,
    lastTranscript,
    errorMessage,
    audioLevel,
  };
}
