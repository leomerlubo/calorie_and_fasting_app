
import React, { useState } from 'react';
import { LogEntry, ActivityType } from '../types';
import CircularProgress from './CircularProgress';
import Modal from './Modal';
import { isSameDay } from '../utils/helpers';

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

  const todayLogs = logs.filter(log => isSameDay(log.timestamp, Date.now()));
  
  const consumed = todayLogs
    .filter(log => log.type === 'food')
    .reduce((sum, log) => sum + log.calories, 0);
  
  const burned = todayLogs
    .filter(log => log.type === 'activity')
    .reduce((sum, log) => sum + log.calories, 0);

  const netCalories = consumed - burned;
  const remaining = dailyLimit - netCalories;
  const percentage = (netCalories / dailyLimit) * 100;
  
  // Show red if remaining is low or negative
  const isRedAlert = remaining <= (dailyLimit * 0.1) || remaining < 0;

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodCalories) return;
    onAddLog({ type: 'food', name: foodName, calories: Number(foodCalories) });
    setFoodName('');
    setFoodCalories('');
    setFoodModalOpen(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityCalories) return;
    onAddLog({ 
      type: 'activity', 
      name: activityType, 
      calories: Number(activityCalories),
      activityType 
    });
    setActivityCalories('');
    setActivityModalOpen(false);
  };

  const confirmDelete = () => {
    if (logToDelete) {
      onDeleteLog(logToDelete.id);
      setLogToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col items-center mb-8">
        <CircularProgress 
          percentage={percentage} 
          label={remaining.toFixed(0)} 
          subLabel={remaining < 0 ? "Over Limit!" : "kcal left"}
          isRedAlert={isRedAlert}
          color="text-rose-600"
        />
        <div className="flex gap-12 mt-6">
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Consumed</p>
            <p className="text-lg font-bold text-slate-700">{consumed}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Burned</p>
            <p className="text-lg font-bold text-slate-700">{burned}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Goal</p>
            <p className="text-lg font-bold text-slate-700">{dailyLimit.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => setFoodModalOpen(true)}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100"
        >
          <div className="bg-white p-2 rounded-full shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Log Food</span>
        </button>
        <button 
          onClick={() => setActivityModalOpen(true)}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100"
        >
          <div className="bg-white p-2 rounded-full shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Log Activity</span>
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        {todayLogs.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No entries logged for today yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.map(log => (
              <div key={log.id} className="group relative bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${log.type === 'food' ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>
                    {log.type === 'food' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-sm">{log.name}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-black text-sm ${log.type === 'food' ? 'text-slate-700' : 'text-orange-600'}`}>
                    {log.type === 'food' ? `-${log.calories}` : `+${log.calories}`} kcal
                  </span>
                  <button 
                    onClick={() => setLogToDelete(log)}
                    className="p-1 text-slate-200 hover:text-rose-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Food Modal */}
      <Modal isOpen={isFoodModalOpen} onClose={() => setFoodModalOpen(false)} title="Log Food">
        <form onSubmit={handleAddFood} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Food Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800"
              placeholder="e.g. Apple, Chicken Salad"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Calories (kcal)</label>
            <input 
              type="number" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800"
              placeholder="0"
              value={foodCalories}
              onChange={(e) => setFoodCalories(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30">
            Log Entry
          </button>
        </form>
      </Modal>

      {/* Log Activity Modal */}
      <Modal isOpen={isActivityModalOpen} onClose={() => setActivityModalOpen(false)} title="Log Activity">
        <form onSubmit={handleAddActivity} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Activity Type</label>
            <div className="relative">
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
              >
                <option value="Walking" className="bg-white text-slate-800">Walking</option>
                <option value="Running" className="bg-white text-slate-800">Running</option>
                <option value="Biking" className="bg-white text-slate-800">Biking</option>
                <option value="HIIT" className="bg-white text-slate-800">HIIT</option>
                <option value="Daily Chores" className="bg-white text-slate-800">Daily Chores</option>
                <option value="Others" className="bg-white text-slate-800">Others</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Calories Burned (kcal)</label>
            <input 
              type="number" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
              placeholder="0"
              value={activityCalories}
              onChange={(e) => setActivityCalories(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30">
            Log Entry
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!logToDelete} 
        onClose={() => setLogToDelete(null)} 
        title="Delete Entry?"
      >
        <div className="space-y-6 text-center">
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Confirm Deletion</h4>
            <p className="text-slate-500 text-sm font-medium">
              Are you sure you want to remove <span className="text-rose-600 font-bold">"{logToDelete?.name}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setLogToDelete(null)}
              className="px-4 py-4 rounded-xl border border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-4 py-4 rounded-xl bg-rose-600 text-white font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CaloriesTab;
