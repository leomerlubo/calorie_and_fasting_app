
import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { calculateBMR } from '../utils/helpers';

interface SettingsTabProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);

  const suggestedBMR = calculateBMR(formData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'height' || name === 'weight' ? Number(value) : value,
    }));
  };

  const toggleManualLimit = (enable: boolean) => {
    setFormData(prev => ({
      ...prev,
      manualLimit: enable ? (prev.manualLimit || suggestedBMR) : null,
    }));
  };

  return (
    <div className="p-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Your Profile</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 text-sm font-bold uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-2xl">
              👤
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Name</p>
              <p className="text-lg font-bold text-slate-800">{profile.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">DOB</p>
              <p className="font-bold text-slate-800">{new Date(profile.dob).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gender</p>
              <p className="font-bold text-slate-800 capitalize">{profile.gender}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Height</p>
              <p className="font-bold text-slate-800">{profile.height} cm</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Weight</p>
              <p className="font-bold text-slate-800">{profile.weight} kg</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-blue-800 font-bold uppercase text-xs tracking-widest">Calorie Limit</h3>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {profile.manualLimit ? 'MANUAL' : 'AUTO BMR'}
              </span>
            </div>
            <p className="text-3xl font-black text-blue-900">
              {(profile.manualLimit || calculateBMR(profile)).toFixed(0)} <span className="text-sm font-normal">kcal / day</span>
            </p>
          </div>

          {profile.address && (
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Address / Timezone</p>
              <p className="font-bold text-slate-800 truncate">{profile.address}</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">DOB</label>
                <input 
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gender</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Height (cm)</label>
                <input 
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                <input 
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Address</label>
              <input 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="For midnight reset location..."
                className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.manualLimit !== null}
                    onChange={(e) => toggleManualLimit(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700">Set Manual Calorie Limit</span>
              </label>

              {formData.manualLimit !== null ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Limit (kcal)</label>
                  <input 
                    type="number"
                    name="manualLimit"
                    value={formData.manualLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, manualLimit: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl text-slate-500 text-sm">
                  We'll use your calculated BMR: <span className="font-bold text-blue-600">{suggestedBMR.toFixed(0)} kcal</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4">
            Save Profile
          </button>
        </form>
      )}
    </div>
  );
};

export default SettingsTab;
