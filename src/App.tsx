import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FullTestView } from './components/FullTestView';
import { ChunkPracticeView } from './components/ChunkPracticeView';
import { ChallengesView } from './components/ChallengesView';
import { MindPalaceView } from './components/MindPalaceView';
import { PracticeQuizAudioView } from './components/PracticeQuizAudioView';
import { DigitsReferenceView } from './components/DigitsReferenceView';
import { StatsView } from './components/StatsView';
import type { AppTab } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<AppTab>('practice');
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);

  const handleSelectChunk = (chunkIndex: number) => {
    setSelectedChunkIndex(chunkIndex);
    setCurrentTab('train_chunks');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sleek top navigation */}
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16 md:pb-8">
        {currentTab === 'practice' && (
          <FullTestView
            onNavigateTab={setCurrentTab}
            onSelectChunkForPractice={handleSelectChunk}
          />
        )}

        {currentTab === 'train_chunks' && (
          <ChunkPracticeView initialChunkIndex={selectedChunkIndex} />
        )}

        {/* Separated Challenge Mode (Idea 1) */}
        {currentTab === 'challenges' && (
          <ChallengesView onNavigateTab={setCurrentTab} />
        )}

        {/* Mind Palace & Mnemonic (Idea 2) */}
        {currentTab === 'techniques' && (
          <MindPalaceView
            onNavigateTab={setCurrentTab}
            onSelectChunkForPractice={handleSelectChunk}
          />
        )}

        {/* Quiz & Audio Ear-Trainer (Idea 3) */}
        {currentTab === 'quiz_audio' && (
          <PracticeQuizAudioView
            onNavigateTab={setCurrentTab}
            onSelectChunkForPractice={handleSelectChunk}
          />
        )}

        {currentTab === 'review' && (
          <DigitsReferenceView
            onNavigateTab={setCurrentTab}
            onSelectChunkForPractice={handleSelectChunk}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            onNavigateTab={setCurrentTab}
            onSelectChunkForPractice={handleSelectChunk}
          />
        )}
      </main>

      {/* Subtle minimalist footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            PiMemory • Aplikasi Pelatih & Stor Hafalan 1.000 Digit Pi
          </p>
          <p className="text-[11px] text-slate-600">
            Penyimpanan data cloud otomatis & sinkronisasi lintas perangkat
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
