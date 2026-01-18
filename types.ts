
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
  FED_STATE = "Fed State",
  EARLY_FASTING = "Early Fasting",
  GLYCOGEN_DEPLETION = "Glycogen Depletion",
  KETOSIS_INITIATION = "Ketosis Initiation",
  DEEP_KETOSIS = "Deep Ketosis",
  AUTOPHAGY_ACTIVATION = "Autophagy Activation",
  PROTEIN_CONSERVATION = "Protein Conservation Phase",
}
