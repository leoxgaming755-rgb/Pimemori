import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  Edit3,
  Check,
  ChevronRight,
  Layers,
  Search,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Save,
} from 'lucide-react';
import { MIND_PALACE_ROOMS, MAJOR_SYSTEM_GUIDE } from '../data/mindPalaceData';
import { PI_DECIMALS, PI_CHUNKS_OF_10 } from '../data/piData';
import { loadLocalMnemonics, saveLocalMnemonic } from '../lib/storage';
import type { AppTab } from '../types';

interface MindPalaceViewProps {
  onNavigateTab: (tab: AppTab) => void;
  onSelectChunkForPractice: (chunkIndex: number) => void;
}

export const MindPalaceView: React.FC<MindPalaceViewProps> = ({
  onNavigateTab,
  onSelectChunkForPractice,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [mnemonics, setMnemonics] = useState<Record<number, string>>({});
  const [editingChunkIndex, setEditingChunkIndex] = useState<number | null>(null);
  const [tempStoryText, setTempStoryText] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'rooms' | 'major_system'>('rooms');

  // Word generator state for Major System
  const [queryDigits, setQueryDigits] = useState<string>('14');

  // Load saved mnemonics
  useEffect(() => {
    const loaded = loadLocalMnemonics();
    setMnemonics(loaded);
  }, []);

  const activeRoom = MIND_PALACE_ROOMS.find((r) => r.id === selectedRoomId) || MIND_PALACE_ROOMS[0];

  // Calculate chunk indices for active room (10 chunks per room)
  // Room 1: startDigit 1..100 -> chunk indices 0..9
  const startChunkIdx = (activeRoom.id - 1) * 10;
  const roomChunks = PI_CHUNKS_OF_10.slice(startChunkIdx, startChunkIdx + 10);

  const handleStartEdit = (chunkIndex: number, currentText: string) => {
    setEditingChunkIndex(chunkIndex);
    setTempStoryText(currentText || '');
  };

  const handleSaveEdit = (chunkIndex: number) => {
    saveLocalMnemonic(chunkIndex, tempStoryText);
    setMnemonics((prev) => {
      const updated = { ...prev };
      if (!tempStoryText.trim()) {
        delete updated[chunkIndex];
      } else {
        updated[chunkIndex] = tempStoryText;
      }
      return updated;
    });
    setEditingChunkIndex(null);
  };

  // Convert digits to Major System phonetic suggestions
  const getMajorPhonetics = (digits: string) => {
    return digits
      .split('')
      .map((d) => {
        const found = MAJOR_SYSTEM_GUIDE.find((g) => g.digit === d);
        return found ? found.sound : '';
      })
      .filter(Boolean)
      .join(' + ');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-900 border border-violet-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              <span>Teknik Memori Juara Dunia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Istana Memori (Mind Palace) 1.000 Digit
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Metode para juara daya ingat internasional: Petakan deretan 1.000 digit Pi ke dalam 10 ruangan megah,
              asosiasikan angka menjadi cerita visual, dan simpan imajinasimu secara permanen.
            </p>
          </div>

          {/* Sub Navigation Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('rooms')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'rooms'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>10 Ruangan Istana</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('major_system')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'major_system'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Pedoman Major System (PAO)</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'rooms' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 10 Rooms Navigation List */}
          <div className="lg:col-span-5 space-y-2.5">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider px-1">
              Pilih Ruangan Istana (100 Digit per Ruang)
            </h2>

            <div className="space-y-2">
              {MIND_PALACE_ROOMS.map((room) => {
                const isSelected = room.id === selectedRoomId;
                // count how many chunks have notes in this room
                const rStart = (room.id - 1) * 10;
                let notesCount = 0;
                for (let i = rStart; i < rStart + 10; i++) {
                  if (mnemonics[i]) notesCount++;
                }

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/40'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl shrink-0 border border-slate-800">
                        {room.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{room.name}</span>
                          <span className="text-[10px] font-mono-num font-semibold px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                            #{room.startDigit}-{room.endDigit}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{room.theme}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {notesCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {notesCount}/10 Catatan
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-violet-400' : 'text-slate-600'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Room Details & 10 Chunks with Mnemonic Notes */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Room Hero Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{activeRoom.icon}</span>
                  <div>
                    <h3 className="text-xl font-black text-white">{activeRoom.name}</h3>
                    <p className="text-xs text-violet-400 font-semibold">{activeRoom.theme}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Jangkauan Digit</span>
                  <span className="text-sm font-bold font-mono-num text-white">
                    Digit ke-{activeRoom.startDigit} s/d {activeRoom.endDigit}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 leading-relaxed">
                💡 <strong>Konteks Visual Ruangan:</strong> {activeRoom.description}
              </p>
            </div>

            {/* Chunks List inside the Room */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  10 Blok Angka di Ruangan Ini (Klik untuk Menulis Cerita Memori)
                </span>
                <span className="text-[11px] text-slate-500">Tersimpan Otomatis</span>
              </div>

              {roomChunks.map((chunk, relIdx) => {
                const chunkIndex = startChunkIdx + relIdx;
                const isEditing = editingChunkIndex === chunkIndex;
                const savedStory = mnemonics[chunkIndex] || '';

                return (
                  <div
                    key={chunkIndex}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Blok #{chunkIndex + 1}
                        </span>
                        <span className="font-mono-num font-bold text-lg text-emerald-400 tracking-wider">
                          {chunk.digits}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectChunkForPractice(chunkIndex);
                            onNavigateTab('train_chunks');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3 text-indigo-400" />
                          <span>Latih Blok</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              handleSaveEdit(chunkIndex);
                            } else {
                              handleStartEdit(chunkIndex, savedStory);
                            }
                          }}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            isEditing
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30'
                          }`}
                        >
                          {isEditing ? (
                            <>
                              <Save className="w-3 h-3" />
                              <span>Simpan</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3 h-3" />
                              <span>{savedStory ? 'Edit Cerita' : '+ Cerita Memori'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mnemonic Story Section */}
                    {isEditing ? (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                        <textarea
                          rows={2}
                          value={tempStoryText}
                          onChange={(e) => setTempStoryText(e.target.value)}
                          placeholder={`Tulis asosiasi ceritamu untuk angka ${chunk.digits}... (Contoh: "Di pintu gerbang kuil, ada Meja (3) dengan Tali (1) mengikat Roti (4)...")`}
                          className="w-full p-3 rounded-xl bg-slate-950 border border-violet-500/50 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-sans"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingChunkIndex(null)}
                            className="px-3 py-1 rounded-lg text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(chunkIndex)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] cursor-pointer"
                          >
                            Simpan Catatan
                          </button>
                        </div>
                      </div>
                    ) : (
                      savedStory && (
                        <div className="p-3 rounded-xl bg-violet-950/25 border border-violet-900/40 text-xs text-violet-200/90 leading-relaxed font-sans">
                          💭 <em>&ldquo;{savedStory}&rdquo;</em>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Major System Guide & Word Helper */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>Pedoman Major System (Mnemonic Konsonan Bahasa Indonesia)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Major System adalah teknik memori tertua di dunia yang mengubah angka menjadi konsonan huruf.
              Huruf vokal (A, I, U, E, O) bebas disisipkan untuk membentuk kata benda konkret yang mudah divisualisasikan.
            </p>
          </div>

          {/* Quick Word Association Helper Tool */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Kamus Asosiasi Cepat
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ketik 2 atau 3 angka untuk melihat padanan konsonan suaranya:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={queryDigits}
                  onChange={(e) => setQueryDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 14"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono-num font-bold text-white w-28 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {queryDigits && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Pola Konsonan:</span>{' '}
                  <strong className="text-amber-300 font-mono-num">{getMajorPhonetics(queryDigits)}</strong>
                </div>
                <div className="text-slate-400">
                  <span>Inspirasi Kata:</span>{' '}
                  <span className="text-emerald-300 font-medium">
                    {queryDigits === '14' && 'T+R -> Tari, Tora, Roti, Duri, Tenda Ratu'}
                    {queryDigits === '15' && 'T+L -> Tali, Telur, Tulang, Dadu Lilin'}
                    {queryDigits === '92' && 'P+N -> Panah, Pintu Naga, Panci Nasi'}
                    {queryDigits === '65' && 'J+L -> Jala, Jalur, Cermin Lilin'}
                    {queryDigits !== '14' &&
                      queryDigits !== '15' &&
                      queryDigits !== '92' &&
                      queryDigits !== '65' &&
                      'Bentuk kata bermakna dengan menyisipkan vokal di antara konsonan di atas!'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reference Table (0-9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {MAJOR_SYSTEM_GUIDE.map((item) => (
              <div
                key={item.digit}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-base font-mono-num border border-indigo-500/30">
                    {item.digit}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Digit</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Bunyi Konsonan:</span>
                  <strong className="text-sm text-white font-medium">{item.sound}</strong>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Contoh Kata:</span>
                  <span className="text-xs text-emerald-300 font-medium">{item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
