
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
type Gender = 'male' | 'female';
interface UserProfile {
  name: string;
  dob: string;
  height: number;
  weight: number;
  gender: Gender;
  address: string;
  manualLimit: number | null;
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
enum FastingStage {
  BLOOD_SUGAR_DROPPING = "Blood sugar is dropping",
  BLOOD_SUGAR_NORMAL = "Blood sugar normalizing",
  FAT_BURNING = "Fat burning mode",
  KETOSIS = "Ketosis state",
  AUTOPHAGY = "Autophagy stage",
  DEEP_AUTOPHAGY = "Deep autophagy",
}

// --- HELPERS ---
const calculateAge = (dob: string): number => {
  const birthday = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
  return age;
};

const calculateBMR = (profile: UserProfile): number => {
  const age = calculateAge(profile.dob);
  if (profile.gender === 'male') {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) + 5;
  } else {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) - 161;
  }
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

// --- COMPONENTS ---
// Added props types to fix implicit any and children missing errors
interface CircularProgressProps {
  percentage: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  isRedAlert?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, label, subLabel, size = 200, strokeWidth = 12, color = 'text-blue-500', isRedAlert = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const displayColor = isRedAlert ? 'text-red-500' : color;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${displayColor} transition-all duration-500 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-3xl font-bold ${displayColor}`}>{label}</span>
        {subLabel && <span className="text-slate-500 text-[10px] font-bold uppercase mt-1">{subLabel}</span>}
      </div>
    </div>
  );
};

// Added ModalProps to fix children missing errors in TSX
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 p-2">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- TAB COMPONENTS ---
// Added CaloriesTabProps for type safety and to resolve Modal prop issues
interface CaloriesTabProps {
  logs: LogEntry[];
  dailyLimit: number;
  onAddLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onDeleteLog: (id: string) => void;
}

const CaloriesTab: React.FC<CaloriesTabProps> = ({ logs, dailyLimit, onAddLog, onDeleteLog }) => {
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
  const isRedAlert = remaining <= (dailyLimit * 0.1) || remaining < 0;

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodCalories) return;
    onAddLog({ type: 'food', name: foodName, calories: Number(foodCalories) });
    setFoodName(''); setFoodCalories(''); setFoodModalOpen(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityCalories) return;
    onAddLog({ type: 'activity', name: activityType, calories: Number(activityCalories), activityType });
    setActivityCalories(''); setActivityModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col items-center mb-6 pt-2">
        <CircularProgress percentage={percentage} label={remaining.toFixed(0)} subLabel={remaining < 0 ? "Over Limit!" : "kcal left"} isRedAlert={isRedAlert} color="text-rose-600" size={210} strokeWidth={14} />
        <div className="flex gap-10 mt-6">
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">In</p>
            <p className="text-xl font-black text-slate-800">{consumed}</p>
          </div>
          <div className="text-center border-x border-slate-100 px-8">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Goal</p>
            <p className="text-xl font-black text-slate-800">{dailyLimit.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Out</p>
            <p className="text-xl font-black text-slate-800">{burned}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <button onClick={() => setFoodModalOpen(true)} className="flex flex-col items-center gap-2 p-6 rounded-[2rem] bg-rose-50 text-rose-600 border border-rose-100 shadow-sm active:scale-95 transition-all">
          <div className="bg-white p-3 rounded-2xl shadow-sm"><span className="text-lg">🍽️</span></div>
          <span className="font-black text-[10px] uppercase tracking-widest">Eat</span>
        </button>
        <button onClick={() => setActivityModalOpen(true)} className="flex flex-col items-center gap-2 p-6 rounded-[2rem] bg-orange-50 text-orange-600 border border-orange-100 shadow-sm active:scale-95 transition-all">
          <div className="bg-white p-3 rounded-2xl shadow-sm"><span className="text-lg">⚡</span></div>
          <span className="font-black text-[10px] uppercase tracking-widest">Burn</span>
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-800 text-xs font-black uppercase tracking-[0.2em] mb-4">Today's History</h3>
        {todayLogs.map(log => (
          <div key={log.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-lg">{log.type === 'food' ? '🥗' : '🏃'}</span>
              <div>
                <p className="text-slate-800 font-bold text-sm leading-tight">{log.name}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-black text-sm ${log.type === 'food' ? 'text-slate-600' : 'text-orange-600'}`}>
                {log.type === 'food' ? `-${log.calories}` : `+${log.calories}`}
              </span>
              <button onClick={() => setLogToDelete(log)} className="text-slate-200 hover:text-rose-500 p-1">✕</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isFoodModalOpen} onClose={() => setFoodModalOpen(false)} title="Log Food">
        <form onSubmit={handleAddFood} className="space-y-4">
          <input type="text" placeholder="What did you eat?" className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
          <input type="number" placeholder="Calories" className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800" value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)} required />
          <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Log Entry</button>
        </form>
      </Modal>

      <Modal isOpen={isActivityModalOpen} onClose={() => setActivityModalOpen(false)} title="Log Activity">
        <form onSubmit={handleAddActivity} className="space-y-4">
          <select className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 appearance-none" value={activityType} onChange={(e) => setActivityType(e.target.value as ActivityType)}>
            <option value="Walking">Walking</option>
            <option value="Running">Running</option>
            <option value="Biking">Biking</option>
            <option value="HIIT">HIIT</option>
            <option value="Daily Chores">Daily Chores</option>
            <option value="Others">Others</option>
          </select>
          <input type="number" placeholder="Calories Burned" className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800" value={activityCalories} onChange={(e) => setActivityCalories(e.target.value)} required />
          <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Log Entry</button>
        </form>
      </Modal>

      <Modal isOpen={!!logToDelete} onClose={() => setLogToDelete(null)} title="Delete?">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setLogToDelete(null)} className="py-4 bg-slate-100 rounded-xl font-bold uppercase text-[10px] tracking-widest">No</button>
          <button onClick={() => { if (logToDelete) { onDeleteLog(logToDelete.id); setLogToDelete(null); } }} className="py-4 bg-rose-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

// Added FastingTabProps for type safety and to resolve Modal prop issues
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
    let interval: any;
    if (fastingState.isActive) interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [fastingState.isActive]);

  const elapsedMs = fastingState.isActive && fastingState.startTime ? currentTime - fastingState.startTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const percentage = Math.min(100, (elapsedHours / 16) * 100);

  const STAGES = [
    { hours: 0, name: "Blood Sugar Dropping", icon: '🩸' },
    { hours: 12, name: "Fat Burning Mode", icon: '🔥' },
    { hours: 18, name: "Ketosis State", icon: '🧠' },
    { hours: 24, name: "Autophagy Stage", icon: '♻️' }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col items-center mb-8">
        <CircularProgress percentage={fastingState.isActive ? percentage : 0} label={fastingState.isActive ? formatTime(elapsedMs) : "00:00:00"} subLabel={fastingState.isActive ? "Time Fasted" : "Ready?"} color="text-indigo-600" size={230} strokeWidth={14} />
        <button onClick={() => fastingState.isActive ? setEndModalOpen(true) : setStartModalOpen(true)} className={`mt-8 w-full py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 ${fastingState.isActive ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
          {fastingState.isActive ? 'End Fasting' : 'Start Fasting Session'}
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">Metabolic Milestones</h3>
        {STAGES.map((stage) => {
          const isActive = elapsedHours >= stage.hours;
          return (
            <div key={stage.name} className={`flex gap-4 items-center transition-all ${isActive ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100'}`}>{stage.icon}</div>
              <div>
                <p className={`text-sm font-black uppercase ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{stage.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{stage.hours}h+</p>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isStartModalOpen} onClose={() => setStartModalOpen(false)} title="Start Fasting">
        <div className="space-y-4">
          <input type="datetime-local" className="w-full px-5 py-4 rounded-xl border border-slate-200 font-bold" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} />
          <button onClick={() => { onStartFast(customStartTime ? new Date(customStartTime).getTime() : Date.now()); setStartModalOpen(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Confirm</button>
        </div>
      </Modal>

      <Modal isOpen={isEndModalOpen} onClose={() => setEndModalOpen(false)} title="End Fast?">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setEndModalOpen(false)} className="py-4 bg-slate-100 rounded-xl font-bold uppercase text-[10px] tracking-widest">Back</button>
          <button onClick={() => { onEndFast(); setEndModalOpen(false); }} className="py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">End Fast</button>
        </div>
      </Modal>
    </div>
  );
};

// Added SettingsTabProps for type safety
interface SettingsTabProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">Your Profile</h2>
        {!isEditing && <button onClick={() => setIsEditing(true)} className="text-rose-600 font-black text-xs uppercase">Edit</button>}
      </div>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); onSaveProfile(formData); setIsEditing(false); }} className="space-y-4">
          <input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" />
          <input type="date" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} placeholder="H (cm)" />
            <input type="number" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} placeholder="W (kg)" />
          </div>
          <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Save Changes</button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
            <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Daily Goal</p>
            <p className="text-5xl font-black italic tracking-tighter">{(profile.manualLimit || calculateBMR(profile)).toFixed(0)} <span className="text-base font-normal not-italic opacity-50">kcal</span></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-100 rounded-3xl"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Height</p><p className="font-bold">{profile.height} cm</p></div>
            <div className="p-5 bg-white border border-slate-100 rounded-3xl"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Weight</p><p className="font-bold">{profile.weight} kg</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calories' | 'fasting' | 'settings'>('calories');
  const [profile, setProfile] = useState<UserProfile>(() => JSON.parse(localStorage.getItem('selflove_profile') || 'null') || { name: 'User', dob: '1995-01-01', height: 175, weight: 70, gender: 'male', manualLimit: null, address: '' });
  const [logs, setLogs] = useState<LogEntry[]>(() => JSON.parse(localStorage.getItem('selflove_logs') || '[]'));
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>(() => JSON.parse(localStorage.getItem('selflove_fasting_logs') || '[]'));
  const [fastingState, setFastingState] = useState<FastingState>(() => JSON.parse(localStorage.getItem('selflove_fasting_state') || 'null') || { isActive: false, startTime: null });

  useEffect(() => { localStorage.setItem('selflove_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('selflove_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('selflove_fasting_logs', JSON.stringify(fastingLogs)); }, [fastingLogs]);
  useEffect(() => { localStorage.setItem('selflove_fasting_state', JSON.stringify(fastingState)); }, [fastingState]);

  const dailyLimit = profile.manualLimit || calculateBMR(profile);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-slate-200 overflow-hidden">
      <header className="bg-white px-6 pt-6 pb-4 flex justify-between items-center border-b border-slate-50">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">#SelfLove</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">1 Corinthians 6:19-20</p>
        </div>
        <button onClick={() => setActiveTab('settings')} className={`p-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>⚙️</button>
      </header>

      <nav className="bg-white border-b border-slate-100 grid grid-cols-2 h-24">
        <button onClick={() => setActiveTab('calories')} className={`relative flex flex-col items-center justify-center transition-all ${activeTab === 'calories' ? 'text-rose-600 bg-rose-50/20' : 'text-slate-300'}`}>
          <span className="text-2xl mb-1">🥗</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Calories</span>
          {activeTab === 'calories' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />}
        </button>
        <button onClick={() => setActiveTab('fasting')} className={`relative flex flex-col items-center justify-center transition-all ${activeTab === 'fasting' ? 'text-indigo-600 bg-indigo-50/20' : 'text-slate-300'}`}>
          <span className="text-2xl mb-1">⏰</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Fasting</span>
          {activeTab === 'fasting' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />}
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto bg-white pb-10">
        {activeTab === 'calories' && <CaloriesTab logs={logs} dailyLimit={dailyLimit} onAddLog={(e) => setLogs([{...e, id: Math.random().toString(), timestamp: Date.now()}, ...logs])} onDeleteLog={(id) => setLogs(logs.filter(l => l.id !== id))} />}
        {activeTab === 'fasting' && <FastingTab fastingState={fastingState} fastingLogs={fastingLogs} onStartFast={(t) => setFastingState({isActive: true, startTime: t})} onEndFast={() => { if (fastingState.startTime) { setFastingLogs([{id: Math.random().toString(), startTime: fastingState.startTime, endTime: Date.now(), duration: Date.now() - fastingState.startTime}, ...fastingLogs]); } setFastingState({isActive: false, startTime: null}); }} />}
        {activeTab === 'settings' && <SettingsTab profile={profile} onSaveProfile={setProfile} />}
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
