
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

interface UserProfile {
  name: string;
  dob: string;
  height: number;
  weight: number;
  gender: Gender;
  timezone: string;
  manualLimit: number | null;
  activityLevel: ActivityLevel;
  deficitGoal: number;
}

type ActivityType = 'Walking' | 'Running' | 'Biking' | 'HIIT' | 'Daily Chores' | 'Others';

interface LogEntry {
  id: string;
  type: 'food' | 'activity';
  name: string;
  calories: number;
  timestamp: number;
  activityType?: ActivityType;
}

interface FastingLog {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface FastingState {
  isActive: boolean;
  startTime: number | null;
}

// --- CONSTANTS ---
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const FASTING_STAGES = [
  { hours: 0, name: "Fed State", desc: "0-4h" },
  { hours: 4, name: "Early Fasting", desc: "4-12h" },
  { hours: 12, name: "Glycogen Depletion", desc: "12-24h" },
  { hours: 24, name: "Ketosis Initiation", desc: "24-48h" },
  { hours: 48, name: "Deep Ketosis", desc: "48-72h" },
  { hours: 72, name: "Autophagy Activation", desc: "72-96h" },
  { hours: 96, name: "Protein Conservation", desc: "96h+" }
];

const GMT_OFFSETS = [
  "GMT-12", "GMT-11", "GMT-10", "GMT-9", "GMT-8", "GMT-7", "GMT-6", "GMT-5", "GMT-4", "GMT-3", "GMT-2", "GMT-1",
  "GMT+0", "GMT+1", "GMT+2", "GMT+3", "GMT+4", "GMT+5", "GMT+6", "GMT+7", "GMT+8", "GMT+9", "GMT+10", "GMT+11", "GMT+12", "GMT+13", "GMT+14"
];

// --- HELPERS ---
const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthday = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
  return age;
};

const calculateDailyTarget = (profile: UserProfile): number => {
  const age = calculateAge(profile.dob);
  const { weight, height, gender, activityLevel, deficitGoal } = profile;
  if (!weight || !height || !age) return 2000;
  
  let bmr = 0;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(tdee - deficitGoal);
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const isSameDay = (d1: number, d2: number): boolean => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const getFastingStageName = (hours: number): string => {
  if (hours < 4) return "Fed State";
  if (hours < 12) return "Early Fasting";
  if (hours < 24) return "Glycogen Depletion";
  if (hours < 48) return "Ketosis Initiation";
  if (hours < 72) return "Deep Ketosis";
  if (hours < 96) return "Autophagy Activation";
  return "Protein Conservation Phase";
};

// --- COMPONENTS ---
interface CircularProgressProps {
  percentage: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  isRedAlert?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, label, subLabel, size = 200, strokeWidth = 8, color = 'text-indigo-600', isRedAlert = false 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const displayColor = isRedAlert ? 'text-red-500' : color;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${displayColor} transition-all duration-700 ease-in-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center px-4">
        <span className={`text-4xl font-black tracking-tighter ${displayColor}`}>{label}</span>
        {subLabel && <span className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest leading-tight">{subLabel}</span>}
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="px-8 pt-8 flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors p-2">✕</button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

// --- TABS ---
const CaloriesTab: React.FC<{ logs: LogEntry[], dailyLimit: number, onAddLog: any, onDeleteLog: any }> = ({ logs, dailyLimit, onAddLog, onDeleteLog }) => {
  const [isFoodModalOpen, setFoodModalOpen] = useState(false);
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('Walking');
  const [activityCalories, setActivityCalories] = useState('');

  const todayLogs = useMemo(() => logs.filter(log => isSameDay(log.timestamp, Date.now())), [logs]);
  const consumed = todayLogs.filter(log => log.type === 'food').reduce((sum, log) => sum + log.calories, 0);
  const burned = todayLogs.filter(log => log.type === 'activity').reduce((sum, log) => sum + log.calories, 0);
  const netCalories = consumed - burned;
  const remaining = dailyLimit - netCalories;
  const percentage = (netCalories / dailyLimit) * 100;
  const isRedAlert = remaining <= 0;

  return (
    <div className="p-8 space-y-12">
      <div className="flex flex-col items-center">
        <CircularProgress percentage={percentage} label={remaining.toFixed(0)} subLabel={remaining < 0 ? "Exceeded" : "Remaining"} isRedAlert={isRedAlert} color="text-indigo-600" size={240} />
        <div className="flex gap-10 mt-10 w-full justify-center items-center">
          <div className="text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Consumed</p>
            <p className="text-lg font-black text-slate-900">{consumed}</p>
          </div>
          <div className="flex flex-col items-center border-x border-slate-100 px-8">
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Goal Limit</p>
            <p className="text-lg font-black text-slate-900">{dailyLimit}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Burned</p>
            <p className="text-lg font-black text-slate-900">{burned}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setFoodModalOpen(true)} className="flex items-center justify-center py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
          + Food
        </button>
        <button onClick={() => setActivityModalOpen(true)} className="flex items-center justify-center py-5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
          + Activity
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em]">Daily Log</h3>
        {todayLogs.length === 0 ? (
          <div className="py-10 text-center text-slate-300 font-bold uppercase text-[9px] tracking-widest">No entries yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between group py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-1.5 rounded-full ${log.type === 'food' ? 'bg-indigo-500' : 'bg-orange-500'}`} />
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{log.name}</p>
                    <p className="text-slate-400 text-[9px] font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-black text-sm ${log.type === 'food' ? 'text-slate-900' : 'text-orange-500'}`}>
                    {log.type === 'food' ? `-${log.calories}` : `+${log.calories}`}
                  </span>
                  <button onClick={() => setLogToDelete(log)} className="text-slate-200 hover:text-indigo-500 transition-all p-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isFoodModalOpen} onClose={() => setFoodModalOpen(false)} title="Add Intake">
        <form onSubmit={(e) => { e.preventDefault(); onAddLog({ type: 'food', name: foodName, calories: Number(foodCalories) }); setFoodName(''); setFoodCalories(''); setFoodModalOpen(false); }} className="space-y-4">
          <input type="text" placeholder="Item Name" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder:text-slate-300 outline-none focus:border-slate-400" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
          <input type="number" placeholder="Calories (kcal)" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder:text-slate-300 outline-none focus:border-slate-400" value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)} required />
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirm Entry</button>
        </form>
      </Modal>

      <Modal isOpen={isActivityModalOpen} onClose={() => setActivityModalOpen(false)} title="Add Burn">
        <form onSubmit={(e) => { e.preventDefault(); onAddLog({ type: 'activity', name: activityType, calories: Number(activityCalories), activityType }); setActivityCalories(''); setActivityModalOpen(false); }} className="space-y-4">
          <select className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold appearance-none outline-none focus:border-slate-400" value={activityType} onChange={(e) => setActivityType(e.target.value as ActivityType)}>
            <option value="Walking">Walking</option>
            <option value="Running">Running</option>
            <option value="Biking">Biking</option>
            <option value="HIIT">HIIT</option>
            <option value="Daily Chores">Daily Chores</option>
          </select>
          <input type="number" placeholder="Energy Burned" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder:text-slate-300 outline-none focus:border-slate-400" value={activityCalories} onChange={(e) => setActivityCalories(e.target.value)} required />
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirm Entry</button>
        </form>
      </Modal>

      <Modal isOpen={!!logToDelete} onClose={() => setLogToDelete(null)} title="Delete Log?">
        <div className="flex gap-4">
          <button onClick={() => setLogToDelete(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest">Cancel</button>
          <button onClick={() => { if (logToDelete) onDeleteLog(logToDelete.id); setLogToDelete(null); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

const FastingTab: React.FC<{ fastingState: FastingState, fastingLogs: FastingLog[], onStartFast: any, onEndFast: any }> = ({ fastingState, fastingLogs, onStartFast, onEndFast }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [isEndModalOpen, setEndModalOpen] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');

  useEffect(() => {
    let interval: any;
    if (fastingState.isActive) interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [fastingState.isActive]);

  const elapsedMs = fastingState.isActive && fastingState.startTime ? currentTime - fastingState.startTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const percentage = Math.min(100, (elapsedHours / 16) * 100);

  const openStartModal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
    setCustomStartTime(localISOTime);
    setStartModalOpen(true);
  };

  return (
    <div className="p-8 space-y-12 pb-32">
      <div className="flex flex-col items-center">
        <CircularProgress percentage={fastingState.isActive ? percentage : 0} label={fastingState.isActive ? formatTime(elapsedMs) : "00:00:00"} subLabel={fastingState.isActive ? getFastingStageName(elapsedHours) : "Tap to start"} color="text-indigo-600" size={240} />
        <button onClick={() => fastingState.isActive ? setEndModalOpen(true) : openStartModal()} className={`mt-10 w-full py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${fastingState.isActive ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
          {fastingState.isActive ? 'Finish Fast' : 'Start Fast'}
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em]">Metabolic Stages</h3>
        <div className="space-y-2">
          {FASTING_STAGES.map((stage) => {
            const isActive = elapsedHours >= stage.hours;
            return (
              <div key={stage.name} className={`flex items-center gap-6 p-5 rounded-3xl border transition-all ${isActive ? 'border-indigo-100 bg-indigo-50/20 shadow-sm' : 'border-slate-50 opacity-40'}`}>
                <div className="flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{stage.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{stage.desc}</p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em]">Recent History</h3>
        {fastingLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-300 font-bold uppercase text-[9px] tracking-widest">No logs found</div>
        ) : (
          <div className="space-y-3">
            {fastingLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-slate-900 font-bold text-sm">{formatTime(log.duration)}</p>
                  <p className="text-slate-400 text-[9px] font-bold uppercase">{new Date(log.startTime).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Complete</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isStartModalOpen} onClose={() => setStartModalOpen(false)} title="Log Start">
        <div className="space-y-6">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">Confirm start time:</p>
          <input type="datetime-local" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} />
          <button onClick={() => { onStartFast(customStartTime ? new Date(customStartTime).getTime() : Date.now()); setStartModalOpen(false); }} className="w-full bg-slate-900 text-white py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirm & Start</button>
        </div>
      </Modal>

      <Modal isOpen={isEndModalOpen} onClose={() => setEndModalOpen(false)} title="End Session">
        <div className="flex gap-4">
          <button onClick={() => setEndModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
          <button onClick={() => { onEndFast(); setEndModalOpen(false); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Complete Fast</button>
        </div>
      </Modal>
    </div>
  );
};

const SettingsTab: React.FC<{ profile: UserProfile, onSaveProfile: any }> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isManual, setIsManual] = useState(profile.manualLimit !== null);

  const calculatedGoal = calculateDailyTarget(formData);

  const handleSave = () => {
    onSaveProfile({
      ...formData,
      manualLimit: isManual ? Number(formData.manualLimit) : null
    });
  };

  return (
    <div className="p-8 space-y-8 pb-32">
      <div className="space-y-6">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
          <input className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Birthday</label>
            <input type="date" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Gender</label>
            <select className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold appearance-none outline-none focus:border-slate-400" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Height (cm)</label>
            <input type="number" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Weight (kg)</label>
            <input type="number" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Daily Activity Level</label>
          <select className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold appearance-none outline-none focus:border-slate-400" value={formData.activityLevel} onChange={e => setFormData({...formData, activityLevel: e.target.value as ActivityLevel})}>
            <option value="sedentary">Sedentary (Little/No Exercise)</option>
            <option value="lightly_active">Lightly Active (1-3 days/week)</option>
            <option value="moderately_active">Moderately Active (3-5 days/week)</option>
            <option value="very_active">Very Active (6-7 days/week)</option>
            <option value="extra_active">Extra Active (Hard Work/Job)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Target Calorie Deficit (kcal)</label>
          <input type="number" step="50" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.deficitGoal} onChange={e => setFormData({...formData, deficitGoal: Number(e.target.value)})} />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">GMT Timezone</label>
          <select className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold appearance-none outline-none focus:border-slate-400" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})}>
            {GMT_OFFSETS.map(offset => <option key={offset} value={offset}>{offset}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Custom Goal Override</span>
          <button onClick={() => setIsManual(!isManual)} className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${isManual ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            {isManual ? 'Manual' : 'Smart Goal'}
          </button>
        </div>

        {isManual ? (
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Manual Goal (kcal)</label>
            <input type="number" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400" value={formData.manualLimit || 2000} onChange={e => setFormData({...formData, manualLimit: Number(e.target.value)})} />
          </div>
        ) : (
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Calculated Smart Goal</p>
            <p className="text-5xl font-black italic tracking-tighter relative z-10">{calculatedGoal}<span className="text-xs font-normal not-italic opacity-40 ml-2">kcal</span></p>
            <p className="text-[8px] text-slate-500 font-bold mt-2 uppercase tracking-widest relative z-10">Includes TDEE & Deficit Adjustments</p>
          </div>
        )}
      </div>

      <button onClick={handleSave} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Save Profile Changes</button>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calories' | 'fasting' | 'settings'>('calories');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('selflove_user_v8');
    return saved ? JSON.parse(saved) : { 
      name: 'User', 
      dob: '1995-01-01', 
      height: 175, 
      weight: 70, 
      gender: 'male', 
      manualLimit: null, 
      timezone: 'GMT+0', 
      activityLevel: 'moderately_active', 
      deficitGoal: 500 
    };
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => JSON.parse(localStorage.getItem('selflove_logs_v8') || '[]'));
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>(() => JSON.parse(localStorage.getItem('selflove_fasting_logs_v8') || '[]'));
  const [fastingState, setFastingState] = useState<FastingState>(() => JSON.parse(localStorage.getItem('selflove_fasting_v8') || 'null') || { isActive: false, startTime: null });

  useEffect(() => localStorage.setItem('selflove_user_v8', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('selflove_logs_v8', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('selflove_fasting_logs_v8', JSON.stringify(fastingLogs)), [fastingLogs]);
  useEffect(() => localStorage.setItem('selflove_fasting_v8', JSON.stringify(fastingState)), [fastingState]);

  const dailyLimit = profile.manualLimit || calculateDailyTarget(profile);

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveTab('calories'); // Redirect to Calories tab after saving
  };

  const handleEndFast = () => {
    if (fastingState.isActive && fastingState.startTime) {
      const now = Date.now();
      const newLog: FastingLog = {
        id: Math.random().toString(),
        startTime: fastingState.startTime,
        endTime: now,
        duration: now - fastingState.startTime
      };
      setFastingLogs([newLog, ...fastingLogs]);
    }
    setFastingState({ isActive: false, startTime: null });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-50 overflow-hidden text-slate-900">
      <header className="px-10 pt-10 pb-6 flex justify-between items-end bg-white z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">#SelfLove</h1>
          <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.5em] mt-2">1 Corinthians 6:19-20</p>
        </div>
        <button onClick={() => setActiveTab('settings')} className={`p-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
        </button>
      </header>

      <nav className="px-10 grid grid-cols-2 gap-4 mt-6">
        <button onClick={() => setActiveTab('calories')} className={`py-6 rounded-[2rem] flex flex-col items-center justify-center transition-all ${activeTab === 'calories' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Calories</span>
        </button>
        <button onClick={() => setActiveTab('fasting')} className={`py-6 rounded-[2rem] flex flex-col items-center justify-center transition-all relative ${activeTab === 'fasting' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Fasting {fastingState.isActive && "•"}
          </span>
          {fastingState.isActive && activeTab !== 'fasting' && (
            <div className="absolute top-2 right-4 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </div>
          )}
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto mt-4 scroll-smooth custom-scrollbar">
        {activeTab === 'calories' && <CaloriesTab logs={logs} dailyLimit={dailyLimit} onAddLog={(e: any) => setLogs([{...e, id: Math.random().toString(), timestamp: Date.now()}, ...logs])} onDeleteLog={(id: string) => setLogs(logs.filter(l => l.id !== id))} />}
        {activeTab === 'fasting' && <FastingTab fastingState={fastingState} fastingLogs={fastingLogs} onStartFast={(t: number) => setFastingState({isActive: true, startTime: t})} onEndFast={handleEndFast} />}
        {activeTab === 'settings' && <SettingsTab profile={profile} onSaveProfile={handleSaveProfile} />}
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
