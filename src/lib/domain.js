export const DEFAULT_THEME = {
  background: '#22333b',
  primary: '#eae0d5',
  secondary: '#c6ac8f',
  tabBackground: '#d1f0b1',
  textPrimary: '#eae0d5',
  textSecondary: '#c6ac8f',
  progressBar: '#00ff00',
  foodButton: '#943a1a',
  activityButton: '#2a722f',
};

export const DEFAULT_PROFILE = {
  name: '',
  heightCm: 160,
  weightKg: 70,
  dob: '1990-01-01',
  gender: 'male',
  activityLevel: 'sedentary',
  calorieGoal: 1800,
  useSuggestedGoal: false,
  timezone: 'Asia/Manila',
  hashtagMode: 'auto',
  manualHashtag: '#HealthFirst',
  colors: DEFAULT_THEME,
};

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

export function calculateAge(dob) {
  if (!dob) return 0;
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

export function calculateBmr(profile) {
  const weight = Number(profile.weightKg) || 0;
  const height = Number(profile.heightCm) || 0;
  const age = calculateAge(profile.dob);
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (profile.gender === 'female') return Math.round(base - 161);
  return Math.round(base + 5);
}

export function calculateTdee(profile) {
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.2;
  return Math.round(calculateBmr(profile) * multiplier);
}

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function prettyDate(key) {
  const today = dateKey();
  const d = new Date(`${key}T12:00:00`);
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return key === today ? `Today: ${label}` : label;
}

export function minutesBetween(startedAt, endedAt = new Date().toISOString()) {
  return Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
}

export function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export function localDateTimeParts(iso) {
  const d = iso ? new Date(iso) : new Date();
  return {
    date: dateKey(d),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
}

export function combineLocalDateTime(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}
