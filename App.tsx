
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, LogEntry, FastingLog, FastingState, ActivityType } from './types';
import { calculateBMR, isSameDay } from './utils/helpers';
import CaloriesTab from './components/CaloriesTab';
import FastingTab from './components/FastingTab';
import SettingsTab from './components/SettingsTab';

const DEFAULT_PROFILE: UserProfile = {
  name: 'New User',
  dob: '1990-01-01',
  height: 175,
  weight: 70,
  gender: 'male',
  address: '',
  manualLimit: null,
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calories' | 'fasting' | 'settings'>('calories');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('wellflow_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('wellflow_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>(() => {
    const saved = localStorage.getItem('wellflow_fasting_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [fastingState, setFastingState] = useState<FastingState>(() => {
    const saved = localStorage.getItem('wellflow_fasting_state');
    return saved ? JSON.parse(saved) : { isActive: false, startTime: null };
  });

  const [lastResetDate, setLastResetDate] = useState<number>(() => {
    const saved = localStorage.getItem('wellflow_last_reset');
    return saved ? parseInt(saved) : Date.now();
  });

  // Persist data
  useEffect(() => {
    localStorage.setItem('wellflow_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('wellflow_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('wellflow_fasting_logs', JSON.stringify(fastingLogs));
  }, [fastingLogs]);

  useEffect(() => {
    localStorage.setItem('wellflow_fasting_state', JSON.stringify(fastingState));
  }, [fastingState]);

  useEffect(() => {
    localStorage.setItem('wellflow_last_reset', lastResetDate.toString());
  }, [lastResetDate]);

  // Midnight Reset Logic
  useEffect(() => {
    const checkReset = () => {
      const now = Date.now();
      if (!isSameDay(now, lastResetDate)) {
        setLastResetDate(now);
      }
    };

    const interval = setInterval(checkReset, 60000);
    checkReset();
    return () => clearInterval(interval);
  }, [lastResetDate]);

  const dailyLimit = profile.manualLimit || calculateBMR(profile);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  const startFast = (startTime: number) => {
    setFastingState({ isActive: true, startTime });
  };

  const endFast = () => {
    if (fastingState.isActive && fastingState.startTime) {
      const now = Date.now();
      const newFastingLog: FastingLog = {
        id: crypto.randomUUID(),
        startTime: fastingState.startTime,
        endTime: now,
        duration: now - fastingState.startTime,
      };
      setFastingLogs(prev => [newFastingLog, ...prev]);
    }
    setFastingState({ isActive: false, startTime: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-slate-200 overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 pt-6 pb-2 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">#SelfLove</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">1 Corinthians 6:19-20</p>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-100 flex items-center px-6 gap-8">
        <button 
          onClick={() => setActiveTab('calories')}
          className={`relative py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calories' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Calories
          {activeTab === 'calories' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('fasting')}
          className={`relative py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'fasting' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Fasting
          {fastingState.isActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
          {activeTab === 'fasting' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full" />}
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {activeTab === 'calories' && (
          <CaloriesTab logs={logs} dailyLimit={dailyLimit} onAddLog={addLog} onDeleteLog={deleteLog} />
        )}
        {activeTab === 'fasting' && (
          <FastingTab 
            fastingState={fastingState} 
            fastingLogs={fastingLogs} 
            onStartFast={startFast} 
            onEndFast={endFast} 
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab profile={profile} onSaveProfile={setProfile} />
        )}
      </main>
    </div>
  );
};

export default App;
