
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
  // Mifflin-St Jeor Equation
  if (profile.gender === 'male') {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) + 5;
  } else {
    return (10 * profile.weight) + (6.25 * profile.height) - (5 * age) - 161;
  }
};

export const getFastingStage = (hours: number): { name: FastingStage; description: string; color: string } => {
  if (hours < 4) return { 
    name: FastingStage.FED_STATE, 
    description: "Insulin is high, body is processing food.",
    color: "text-blue-400"
  };
  if (hours < 12) return { 
    name: FastingStage.EARLY_FASTING, 
    description: "Blood sugar begins to normalize.",
    color: "text-cyan-500"
  };
  if (hours < 24) return { 
    name: FastingStage.GLYCOGEN_DEPLETION, 
    description: "Liver glycogen stores are being used up.",
    color: "text-emerald-500"
  };
  if (hours < 48) return { 
    name: FastingStage.KETOSIS_INITIATION, 
    description: "Body starts burning fat for fuel.",
    color: "text-amber-500"
  };
  if (hours < 72) return { 
    name: FastingStage.DEEP_KETOSIS, 
    description: "Fat burning is maximized; hunger often fades.",
    color: "text-orange-600"
  };
  if (hours < 96) return { 
    name: FastingStage.AUTOPHAGY_ACTIVATION, 
    description: "Cells recycle damaged components.",
    color: "text-indigo-600"
  };
  return { 
    name: FastingStage.PROTEIN_CONSERVATION, 
    description: "Metabolism shifts to protect muscle mass.",
    color: "text-purple-700"
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
