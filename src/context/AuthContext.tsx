import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  testConnection,
} from '../lib/firebase';
import {
  loadLocalStats,
  saveLocalStats,
  loadLocalSessions,
  saveLocalSession,
  fetchUserStatsFromFirestore,
  saveUserStatsToFirestore,
  fetchSessionsFromFirestore,
  saveSessionToFirestore,
  calculateNewStreak,
  getDefaultUserStats,
} from '../lib/storage';
import type { UserStats, PracticeSessionRecord } from '../types';

interface AuthContextType {
  user: User | null;
  stats: UserStats;
  sessions: PracticeSessionRecord[];
  loading: boolean;
  isSyncing: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  recordSession: (result: Omit<PracticeSessionRecord, 'id' | 'userId' | 'createdAt'>) => Promise<{
    isNewRecord: boolean;
    record: PracticeSessionRecord;
  }>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>(loadLocalStats());
  const [sessions, setSessions] = useState<PracticeSessionRecord[]>(loadLocalSessions());
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize connection test and auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        try {
          const remoteStats = await fetchUserStatsFromFirestore(currentUser.uid);
          const remoteSessions = await fetchSessionsFromFirestore(currentUser.uid);

          const localStats = loadLocalStats();

          if (remoteStats) {
            // Merge with local best if local had offline improvements
            const mergedBest = Math.max(remoteStats.bestScore || 0, localStats.bestScore || 0);
            const mergedTotalRecalled = Math.max(remoteStats.totalDigitsRecalled || 0, localStats.totalDigitsRecalled || 0);
            const mergedTotalSessions = Math.max(remoteStats.totalSessions || 0, localStats.totalSessions || 0);

            const updated: UserStats = {
              ...remoteStats,
              bestScore: mergedBest,
              totalDigitsRecalled: mergedTotalRecalled,
              totalSessions: mergedTotalSessions,
              displayName: currentUser.displayName || remoteStats.displayName || 'Pengguna',
              email: currentUser.email || remoteStats.email || '',
              updatedAt: new Date().toISOString(),
            };

            await saveUserStatsToFirestore(updated);
            setStats(updated);
          } else {
            // First time cloud setup for this user
            const initial: UserStats = {
              ...localStats,
              userId: currentUser.uid,
              displayName: currentUser.displayName || 'Pengguna',
              email: currentUser.email || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveUserStatsToFirestore(initial);
            setStats(initial);
          }

          setSessions(remoteSessions);
        } catch (err) {
          console.error('Error syncing user data on login:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Guest mode fallback
        setStats(loadLocalStats());
        setSessions(loadLocalSessions());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setStats(loadLocalStats());
      setSessions(loadLocalSessions());
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const recordSession = useCallback(
    async (result: Omit<PracticeSessionRecord, 'id' | 'userId' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const userId = user ? user.uid : 'guest';
      const sessionId = 'ses_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      const record: PracticeSessionRecord = {
        ...result,
        id: sessionId,
        userId,
        createdAt: now,
      };

      const isNewRecord = record.score > stats.bestScore;
      const { streak, today } = calculateNewStreak(stats.lastActiveDate, stats.currentStreak);

      const updatedStats: UserStats = {
        ...stats,
        userId,
        bestScore: Math.max(stats.bestScore, record.score),
        totalSessions: stats.totalSessions + 1,
        totalDigitsRecalled: stats.totalDigitsRecalled + record.score,
        currentStreak: streak,
        lastActiveDate: today,
        updatedAt: now,
      };

      // Update state immediately for instant responsive UI
      setStats(updatedStats);
      setSessions((prev) => [record, ...prev]);

      // Save locally
      saveLocalStats(updatedStats);
      saveLocalSession(record);

      // If user is authenticated, sync to Firestore
      if (user) {
        setIsSyncing(true);
        try {
          await saveUserStatsToFirestore(updatedStats);
          await saveSessionToFirestore(record);
        } catch (err) {
          console.error('Failed to sync session to Firestore:', err);
        } finally {
          setIsSyncing(false);
        }
      }

      return { isNewRecord, record };
    },
    [user, stats]
  );

  const refreshData = async () => {
    if (!user) {
      setStats(loadLocalStats());
      setSessions(loadLocalSessions());
      return;
    }
    setIsSyncing(true);
    try {
      const remoteStats = await fetchUserStatsFromFirestore(user.uid);
      const remoteSessions = await fetchSessionsFromFirestore(user.uid);
      if (remoteStats) setStats(remoteStats);
      setSessions(remoteSessions);
    } catch (err) {
      console.error('Failed refreshing data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        sessions,
        loading,
        isSyncing,
        loginWithGoogle,
        logout,
        recordSession,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
