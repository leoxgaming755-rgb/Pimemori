import React, { useMemo } from 'react';
import {
  Trophy,
  Flame,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cloud,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MILESTONES } from '../data/piData';
import type { AppTab, PracticeSessionRecord } from '../types';

interface StatsViewProps {
  onNavigateTab: (tab: AppTab) => void;
  onSelectChunkForPractice?: (chunkIndex: number) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  onNavigateTab,
  onSelectChunkForPractice,
}) => {
  const { stats, sessions, user, isSyncing, loginWithGoogle } = useAuth();

  // Aggregate stats per day for the last 14 days
  const dailyData = useMemo(() => {
    const daysMap: Record<string, { count: number; bestScore: number; dateStr: string }> = {};

    // Initialize past 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      daysMap[key] = { count: 0, bestScore: 0, dateStr: dateLabel };
    }

    sessions.forEach((s) => {
      const day = s.createdAt.split('T')[0];
      if (daysMap[day]) {
        daysMap[day].count += 1;
        if (s.score > daysMap[day].bestScore) {
          daysMap[day].bestScore = s.score;
        }
      }
    });

    return Object.entries(daysMap).map(([dayKey, val]) => ({
      dayKey,
      ...val,
    }));
  }, [sessions]);

  // Max score in the last 14 days for chart scale
  const maxChartScore = Math.max(stats.bestScore, 50, ...dailyData.map((d) => d.bestScore));

  // Identify weak spots (which digit indices caused errors)
  const weakSpots = useMemo(() => {
    const mistakeFrequencies: Record<number, number> = {};
    sessions.forEach((s) => {
      if (s.firstMistakeIndex >= 0) {
        mistakeFrequencies[s.firstMistakeIndex] = (mistakeFrequencies[s.firstMistakeIndex] || 0) + 1;
      }
    });

    return Object.entries(mistakeFrequencies)
      .map(([indexStr, count]) => ({
        digitIndex: Number(indexStr) + 1, // 1-based digit
        count,
        chunkIndex: Math.floor(Number(indexStr) / 10),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sessions]);

  // Average accuracy
  const avgAccuracy = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0);
    return Math.round(sum / sessions.length);
  }, [sessions]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Statistik & Kemajuan Harian</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau konsistensi latihan hafalan angka dan perkembangan memorimu setiap hari.
          </p>
        </div>

        {/* Cloud Sync Status */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
              <Cloud className="w-4 h-4" />
              <span>Tersinkron di Akun ({user.displayName || user.email})</span>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold shadow-md transition cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Masuk Google untuk Sync Multi-Perangkat</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Best Score */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Rekor Digit Tertinggi</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono-num text-emerald-400">
              {stats.bestScore}
            </span>
            <span className="text-xs text-slate-400">/ 1.000</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {((stats.bestScore / 1000) * 100).toFixed(1)}% dari 1000 digit tercapai
          </div>
        </div>

        {/* Daily Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Streak Latihan</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono-num text-orange-400">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-slate-400">hari aktif</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.lastActiveDate ? `Terakhir: ${stats.lastActiveDate}` : 'Mulai hari ini!'}
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Sesi Latihan</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono-num text-indigo-300">
              {stats.totalSessions}
            </span>
            <span className="text-xs text-slate-400">sesi</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.totalDigitsRecalled} digit total diketik
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Rata-Rata Akurasi</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono-num text-sky-300">
              {avgAccuracy}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Dari seluruh riwayat sesi</div>
        </div>
      </div>

      {/* Daily Progress Chart (Last 14 Days) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Kemajuan Hafalan 14 Hari Terakhir</h2>
          </div>
          <span className="text-xs text-slate-400">Skor Tertinggi Tiap Hari</span>
        </div>

        {/* Bar chart */}
        <div className="h-48 pt-6 flex items-end justify-between gap-1 sm:gap-2">
          {dailyData.map((d) => {
            const heightPercent = maxChartScore > 0 ? Math.max(6, (d.bestScore / maxChartScore) * 100) : 6;
            const hasActivity = d.count > 0;

            return (
              <div key={d.dayKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] text-white shadow-xl pointer-events-none z-20 whitespace-nowrap">
                  <p className="font-bold">{d.dateStr}</p>
                  <p className="text-indigo-300 font-mono-num">Rekor: {d.bestScore} digit</p>
                  <p className="text-slate-400">{d.count} sesi latihan</p>
                </div>

                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                    hasActivity
                      ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-emerald-400 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-800/40'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[32px] select-none">
                  {d.dateStr.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Spots Analysis & Milestone Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weak spots */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Analisis Titik Hambatan (Weak Spots)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Digit angka di mana kamu paling sering keliru saat sesi stor hafalan:
          </p>

          {weakSpots.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada data kesalahan yang cukup. Teruslah berlatih!
            </div>
          ) : (
            <div className="space-y-2.5">
              {weakSpots.map((ws, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Digit ke-{ws.digitIndex}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ws.count} kali kesalahan terjadi di posisi ini
                      </p>
                    </div>
                  </div>

                  {onSelectChunkForPractice && (
                    <button
                      onClick={() => {
                        onSelectChunkForPractice(ws.chunkIndex);
                        onNavigateTab('train_chunks');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Latih Blok Ini</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Badges */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Lencana Pencapaian Hafalan</h2>
          </div>
          <p className="text-xs text-slate-400">
            Kunci lencana seiring bertambahnya jumlah digit yang berhasil kamu hafal:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MILESTONES.map((m) => {
              const unlocked = stats.bestScore >= m.count;
              return (
                <div
                  key={m.count}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                    unlocked
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="text-2xl select-none">{m.badge}</span>
                  <div>
                    <p className={`text-xs font-bold ${unlocked ? 'text-white' : 'text-slate-400'}`}>
                      {m.label}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {unlocked ? '✅ Tercapai' : `Butuh ${m.count} digit`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Riwayat Sesi Latihan Terbaru</h2>
          </div>
          <span className="text-xs text-slate-400">{sessions.length} total sesi tersimpan</span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada riwayat sesi. Mulai tes pertamamu di tab &quot;Stor Hafalan&quot;!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Tanggal & Waktu</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Skor Dihafal</th>
                  <th className="py-3 px-3">Akurasi</th>
                  <th className="py-3 px-3">Durasi</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {sessions.slice(0, 15).map((s) => {
                  const date = new Date(s.createdAt);
                  const formattedDate = date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-sans text-slate-400">{formattedDate}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                          {s.mode === 'full_test'
                            ? 'Stor Penuh'
                            : s.mode === 'chunk_practice'
                            ? `Blok (${s.targetChunk || 'Chunk'})`
                            : 'Latihan'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        <span className="text-emerald-400">{s.score}</span> digit
                      </td>
                      <td className="py-3 px-3 text-slate-300">{s.accuracy}%</td>
                      <td className="py-3 px-3 text-slate-400">{s.durationSeconds}s</td>
                      <td className="py-3 px-3 font-sans">
                        {s.firstMistakeIndex >= 0 ? (
                          <span className="text-amber-400/90 text-[11px]">
                            Macet di #{s.firstMistakeIndex + 1}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-semibold">
                            Tuntas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
