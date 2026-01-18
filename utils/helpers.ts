
import { UserProfile, FastingStage } from '../types';

export const calculateAge = (dob: string): number => {
  const birthday = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
};

export const calculateBMR = (profile: UserProfile): number => {
  const age = calculateAge(profile.dob);
  if (profile.gender === 'male') {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) + 5;
  } else {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) - 161;
  }
};

export const getFastingStage = (hours: number): { name: FastingStage; description: string; color: string } => {
  if (hours < 4) return { 
    name: FastingStage.BLOOD_SUGAR_DROPPING, 
    description: "Insulin levels start to drop.",
    color: "text-blue-500"
  };
  if (hours < 12) return { 
    name: FastingStage.BLOOD_SUGAR_NORMAL, 
    description: "Blood sugar levels are stabilizing.",
    color: "text-cyan-500"
  };
  if (hours < 18) return { 
    name: FastingStage.FAT_BURNING, 
    description: "Body starts switching to fat as fuel.",
    color: "text-emerald-500"
  };
  if (hours < 24) return { 
    name: FastingStage.KETOSIS, 
    description: "The liver produces ketones for energy.",
    color: "text-amber-500"
  };
  if (hours < 48) return { 
    name: FastingStage.AUTOPHAGY, 
    description: "Cells begin recycling old parts.",
    color: "text-indigo-500"
  };
  return { 
    name: FastingStage.DEEP_AUTOPHAGY, 
    description: "Maximum cell regeneration and healing.",
    color: "text-purple-600"
  };
};

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const isSameDay = (d1: number, d2: number): boolean => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};
