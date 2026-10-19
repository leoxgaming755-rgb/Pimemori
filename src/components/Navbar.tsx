import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Cloud,
  CloudOff,
  LogOut,
  User as UserIcon,
  BookOpen,
  Target,
  BarChart2,
  Layers,
  Sparkles,
  Zap,
  Brain,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/sound';
import type { AppTab } from '../types';

interface NavbarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, stats, isSyncing, loginWithGoogle, logout } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('practice')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
                <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center font-bold text-lg text-indigo-400 group-hover:text-white transition-colors">
                  π
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-base tracking-tight text-white">
                  <span>PiMemory</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    1000 Digit
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Pelatih & Stor Hafalan Angka</p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs - Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => onTabChange('practice')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Stor Hafalan</span>
            </button>

            <button
              onClick={() => onTabChange('train_chunks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'train_chunks'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Latih Blok</span>
            </button>

            {/* Separated Challenge Mode (Idea 1) */}
            <button
              onClick={() => onTabChange('challenges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'challenges'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Tantangan</span>
            </button>

            {/* Mind Palace (Idea 2) */}
            <button
              onClick={() => onTabChange('techniques')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'techniques'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-4 h-4 text-violet-400" />
              <span>Istana Memori</span>
            </button>

            {/* Quiz & Audio (Idea 3) */}
            <button
              onClick={() => onTabChange('quiz_audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'quiz_audio'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Headphones className="w-4 h-4 text-teal-400" />
              <span>Kuis & Audio</span>
            </button>

            <button
              onClick={() => onTabChange('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'review'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1000 Digit</span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Statistik</span>
            </button>
          </nav>

          {/* Right items: Stats quick pills, sound toggle, auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak pill */}
            <div
              title={`Streak latihan: ${stats.currentStreak} hari aktif berturut-turut`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{stats.currentStreak}h</span>
            </div>

            {/* Best score pill */}
            <div
              title={`Rekor hafalan terbaik kamu: ${stats.bestScore} digit berturut-turut tanpa salah`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats.bestScore} Digit</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara Ketikan' : 'Nyalakan Suara Ketikan'}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Cloud Sync Status / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Akun'}
                      className="w-6 h-6 rounded-full border border-indigo-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-300 max-w-[90px] truncate">
                    <span className="truncate">{user.displayName?.split(' ')[0] || 'Tersimpan'}</span>
                    <Cloud className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-sm">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="font-semibold text-slate-100 truncate">{user.displayName || 'Pengguna'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <Cloud className="w-3 h-3" />
                        <span>Database Cloud Aktif</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <CloudOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masuk Google (Simpan Lintas Perangkat)</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/95 py-2 px-1 overflow-x-auto">
        <button
          onClick={() => onTabChange('practice')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'practice' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Stor</span>
        </button>
        <button
          onClick={() => onTabChange('train_chunks')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'train_chunks' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Blok</span>
        </button>
        <button
          onClick={() => onTabChange('challenges')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'challenges' ? 'text-amber-400 font-bold' : 'text-amber-400/70'
          }`}
        >
          <Zap className="w-4 h-4 fill-amber-400" />
          <span>Tantangan</span>
        </button>
        <button
          onClick={() => onTabChange('techniques')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'techniques' ? 'text-violet-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Istana</span>
        </button>
        <button
          onClick={() => onTabChange('quiz_audio')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'quiz_audio' ? 'text-teal-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Kuis</span>
        </button>
        <button
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            currentTab === 'stats' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Statistik</span>
        </button>
      </div>
    </header>
  );
};
