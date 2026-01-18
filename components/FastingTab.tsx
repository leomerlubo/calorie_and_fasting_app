
import React, { useState, useEffect } from 'react';
import { FastingState, FastingLog, FastingStage } from '../types';
import CircularProgress from './CircularProgress';
import Modal from './Modal';
import { formatTime, getFastingStage } from '../utils/helpers';

interface FastingTabProps {
  fastingState: FastingState;
  fastingLogs: FastingLog[];
  onStartFast: (startTime: number) => void;
  onEndFast: () => void;
}

const FastingTab: React.FC<FastingTabProps> = ({ fastingState, fastingLogs, onStartFast, onEndFast }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [isEndModalOpen, setEndModalOpen] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (fastingState.isActive) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fastingState.isActive]);

  const elapsedMs = fastingState.isActive && fastingState.startTime ? currentTime - fastingState.startTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const stageInfo = getFastingStage(elapsedHours);

  const STAGES = [
    { hours: 0, name: "Fed State", icon: '🥣', desc: "0-4h" },
    { hours: 4, name: "Early Fasting", icon: '⏳', desc: "4-12h" },
    { hours: 12, name: "Glycogen Depletion", icon: '🔋', desc: "12-24h" },
    { hours: 24, name: "Ketosis Initiation", icon: '🔥', desc: "24-48h" },
    { hours: 48, name: "Deep Ketosis", icon: '💎', desc: "48-72h" },
    { hours: 48, name: "Autophagy Activation", icon: '♻️', desc: "48-96h" },
    { hours: 72, name: "Protein Conservation", icon: '🛡️', desc: "72h+" }
  ];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = customStartTime ? new Date(customStartTime).getTime() : Date.now();
    onStartFast(startTime);
    setStartModalOpen(false);
  };

  const openStartModal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
    setCustomStartTime(localISOTime);
    setStartModalOpen(true);
  };

  const handleConfirmEndFast = () => {
    onEndFast();
    setEndModalOpen(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col items-center py-6 bg-white rounded-3xl shadow-sm">
        <CircularProgress 
          percentage={fastingState.isActive ? Math.min(100, (elapsedHours / 16) * 100) : 0} 
          label={fastingState.isActive ? formatTime(elapsedMs) : "00:00:00"} 
          subLabel={fastingState.isActive ? stageInfo.name : "Tap to start"}
          color="text-indigo-600"
          size={240}
          strokeWidth={14}
        />
        
        {fastingState.isActive && (
          <div className="mt-4 text-center px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className={`font-black uppercase text-xs tracking-widest ${stageInfo.color}`}>{stageInfo.name}</p>
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-1">{stageInfo.description}</p>
          </div>
        )}

        <div className="mt-8 w-full px-8">
          {fastingState.isActive ? (
            <button 
              onClick={() => setEndModalOpen(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-colors shadow-lg"
            >
              Finish Fast
            </button>
          ) : (
            <button 
              onClick={openStartModal}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              Start Fasting
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-800 font-black uppercase text-xs tracking-widest px-2">Metabolic Milestones</h3>
        <div className="grid grid-cols-1 gap-2.5">
          {STAGES.map((stage, idx) => {
            const isActive = elapsedHours >= stage.hours;
            return (
              <div key={`${stage.name}-${idx}`} className={`flex gap-4 items-center p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-50/30 border-indigo-50 opacity-100' : 'border-slate-50 opacity-40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100'}`}>{stage.icon}</div>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{stage.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isStartModalOpen} onClose={() => setStartModalOpen(false)} title="Start Time">
        <form onSubmit={handleStart} className="space-y-4">
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">When was your last meal?</p>
          <input 
            type="datetime-local" 
            className="w-full px-5 py-4 rounded-xl border border-slate-100 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={customStartTime}
            onChange={(e) => setCustomStartTime(e.target.value)}
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Confirm & Start</button>
        </form>
      </Modal>

      <Modal isOpen={isEndModalOpen} onClose={() => setEndModalOpen(false)} title="End Fast">
        <div className="space-y-4">
          <p className="text-slate-600 font-medium">Completed Fast: <span className="font-black text-indigo-600">{formatTime(elapsedMs)}</span></p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setEndModalOpen(false)}
              className="py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmEndFast}
              className="py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
            >
              Log Fast
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FastingTab;
