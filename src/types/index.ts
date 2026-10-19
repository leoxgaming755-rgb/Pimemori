export type AppTab =
  | 'practice'
  | 'train_chunks'
  | 'challenges'
  | 'quiz_audio'
  | 'techniques'
  | 'review'
  | 'stats';

export type PracticeMode =
  | 'full_test'
  | 'chunk_practice'
  | 'flashcard'
  | 'quiz'
  | 'time_attack_60'
  | 'blindfolded'
  | 'speedrun_50';

export interface UserStats {
  userId: string;
  displayName: string;
  email: string;
  bestScore: number;
  totalSessions: number;
  totalDigitsRecalled: number;
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSessionRecord {
  id: string;
  userId: string;
  score: number;
  totalAttempted: number;
  accuracy: number;
  durationSeconds: number;
  mode: PracticeMode;
  targetChunk?: string;
  firstMistakeIndex: number;
  createdAt: string;
}

export interface DigitInputState {
  char: string;
  isCorrect: boolean;
  expected: string;
}

export interface DailyActivityPoint {
  date: string; // YYYY-MM-DD
  count: number;
  bestScore: number;
  totalDigits: number;
}

export interface MnemonicNote {
  chunkIndex: number; // 0..99
  roomName: string;
  story: string;
  updatedAt: string;
}

export interface MindPalaceRoom {
  id: number;
  name: string;
  theme: string;
  icon: string;
  startDigit: number;
  endDigit: number;
  description: string;
}
