import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface KeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onDigitPress,
  onBackspace,
  onReset,
  disabled = false,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-2.5 p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl select-none">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigitPress(digit)}
          className="h-14 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-xl font-bold font-mono-num text-slate-100 shadow transition-all duration-150 flex items-center justify-center border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {digit}
        </button>
      ))}

      {/* Bottom row: Reset/Special, 0, Backspace */}
      {onReset ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onReset}
          title="Ulangi"
          className="h-14 rounded-xl bg-slate-800/50 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 active:scale-95 transition-all flex items-center justify-center border border-slate-800 hover:border-rose-500/40 cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      ) : (
        <div className="h-14" />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigitPress('0')}
        className="h-14 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-xl font-bold font-mono-num text-slate-100 shadow transition-all duration-150 flex items-center justify-center border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer disabled:opacity-50"
      >
        0
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        title="Hapus Satu Digit"
        className="h-14 rounded-xl bg-slate-800/70 hover:bg-amber-900/30 text-amber-400 active:scale-95 transition-all flex items-center justify-center border border-slate-800 hover:border-amber-500/40 cursor-pointer disabled:opacity-50"
      >
        <Delete className="w-6 h-6" />
      </button>
    </div>
  );
};
