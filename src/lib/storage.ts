import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  handleFirestoreError,
  OperationType,
} from './firebase';
import type { UserStats, PracticeSessionRecord } from '../types';

const LOCAL_STATS_KEY = 'pimemory_local_stats_v1';
const LOCAL_SESSIONS_KEY = 'pimemory_local_sessions_v1';

export function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function getDefaultUserStats(userId: string = 'guest'): UserStats {
  const now = new Date().toISOString();
  return {
    userId,
    displayName: userId === 'guest' ? 'Tamu' : 'Pengguna',
    email: '',
    bestScore: 0,
    totalSessions: 0,
    totalDigitsRecalled: 0,
    currentStreak: 0,
    lastActiveDate: '',
    createdAt: now,
    updatedAt: now,
  };
}

// Local storage helpers
export function loadLocalStats(): UserStats {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading local stats', e);
  }
  return getDefaultUserStats('guest');
}

export function saveLocalStats(stats: UserStats) {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed saving local stats', e);
  }
}

export function loadLocalSessions(): PracticeSessionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading local sessions', e);
  }
  return [];
}

export function saveLocalSession(session: PracticeSessionRecord) {
  try {
    const existing = loadLocalSessions();
    existing.unshift(session);
    // keep latest 100 sessions locally
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.error('Failed saving local session', e);
  }
}

// Firestore operations
export async function fetchUserStatsFromFirestore(userId: string): Promise<UserStats | null> {
  const path = `users/${userId}`;
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserStats;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserStatsToFirestore(stats: UserStats): Promise<void> {
  const path = `users/${stats.userId}`;
  try {
    const ref = doc(db, 'users', stats.userId);
    await setDoc(ref, stats, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSessionToFirestore(session: PracticeSessionRecord): Promise<void> {
  const path = `users/${session.userId}/sessions/${session.id}`;
  try {
    const ref = doc(db, 'users', session.userId, 'sessions', session.id);
    await setDoc(ref, session);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchSessionsFromFirestore(
  userId: string,
  sessionLimit: number = 50
): Promise<PracticeSessionRecord[]> {
  const path = `users/${userId}/sessions`;
  try {
    const colRef = collection(db, 'users', userId, 'sessions');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(sessionLimit));
    const snap = await getDocs(q);
    const sessions: PracticeSessionRecord[] = [];
    snap.forEach((docSnap) => {
      sessions.push(docSnap.data() as PracticeSessionRecord);
    });
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Update streak calculation based on lastActiveDate and today's date
 */
export function calculateNewStreak(lastActiveDate: string, currentStreak: number): { streak: number; today: string } {
  const today = getTodayString();
  if (!lastActiveDate) {
    return { streak: 1, today };
  }

  if (lastActiveDate === today) {
    return { streak: currentStreak || 1, today };
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActiveDate === yesterdayStr) {
    return { streak: (currentStreak || 0) + 1, today };
  }

  // Streak broken, reset to 1
  return { streak: 1, today };
}

const LOCAL_MNEMONICS_KEY = 'pimemory_local_mnemonics_v1';

export function loadLocalMnemonics(): Record<number, string> {
  try {
    const raw = localStorage.getItem(LOCAL_MNEMONICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading mnemonics', e);
  }
  return {};
}

export function saveLocalMnemonic(chunkIndex: number, story: string) {
  try {
    const data = loadLocalMnemonics();
    if (!story.trim()) {
      delete data[chunkIndex];
    } else {
      data[chunkIndex] = story;
    }
    localStorage.setItem(LOCAL_MNEMONICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving mnemonic', e);
  }
}
