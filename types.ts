
export type Gender = 'male' | 'female';

export interface UserProfile {
  name: string;
  dob: string;
  height: number; // in cm
  weight: number; // in kg
  gender: Gender;
  address: string;
  manualLimit: number | null;
}

export type ActivityType = 'Walking' | 'Running' | 'Biking' | 'HIIT' | 'Daily Chores' | 'Others';

export interface LogEntry {
  id: string;
  type: 'food' | 'activity';
  name: string;
  calories: number;
  timestamp: number;
  activityType?: ActivityType;
}

export interface FastingLog {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
}

export interface FastingState {
  isActive: boolean;
  startTime: number | null;
}

export enum FastingStage {
  BLOOD_SUGAR_DROPPING = "Blood sugar is dropping",
  BLOOD_SUGAR_NORMAL = "Blood sugar normalizing",
  FAT_BURNING = "Fat burning mode",
  KETOSIS = "Ketosis state",
  AUTOPHAGY = "Autophagy stage",
  DEEP_AUTOPHAGY = "Deep autophagy",
}
