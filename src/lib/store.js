import { DEFAULT_PROFILE } from './domain.js';
import { isSupabaseConfigured, supabase } from './supabase.js';

const LOCAL_KEY = 'myWellness.preview.v1';

function blankLocal() {
  return { profile: DEFAULT_PROFILE, foods: [], activities: [], menus: [], fasting: [] };
}

function loadLocal() {
  try {
    return { ...blankLocal(), ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') };
  } catch {
    return blankLocal();
  }
}

function saveLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

export async function loadUserData(userId) {
  if (!isSupabaseConfigured || !userId) return loadLocal();
  const [profileResult, foodsResult, activitiesResult, menusResult, fastingResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('food_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('food_presets').select('*').order('name'),
    supabase.from('fasting_sessions').select('*').order('started_at', { ascending: false }),
  ]);
  const errors = [profileResult, foodsResult, activitiesResult, menusResult, fastingResult].map(r => r.error).filter(Boolean);
  if (errors.length) throw errors[0];
  const p = profileResult.data;
  return {
    profile: p ? {
      name: p.name || '',
      heightCm: p.height_cm || 160,
      weightKg: p.weight_kg || 70,
      dob: p.dob || '1990-01-01',
      gender: p.gender || 'male',
      activityLevel: p.activity_level || 'sedentary',
      calorieGoal: p.calorie_goal || 1800,
      useSuggestedGoal: p.use_suggested_goal || false,
      timezone: p.timezone || 'Asia/Manila',
      hashtagMode: p.hashtag_mode || 'auto',
      manualHashtag: p.manual_hashtag || '#HealthFirst',
      colors: p.colors || DEFAULT_PROFILE.colors,
    } : DEFAULT_PROFILE,
    foods: foodsResult.data || [],
    activities: activitiesResult.data || [],
    menus: menusResult.data || [],
    fasting: fastingResult.data || [],
  };
}

export async function saveProfile(userId, profile) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal(); state.profile = profile; saveLocal(state); return profile;
  }
  const payload = {
    user_id: userId,
    name: profile.name,
    height_cm: Number(profile.heightCm),
    weight_kg: Number(profile.weightKg),
    dob: profile.dob,
    gender: profile.gender,
    activity_level: profile.activityLevel,
    calorie_goal: Number(profile.calorieGoal),
    use_suggested_goal: Boolean(profile.useSuggestedGoal),
    timezone: profile.timezone,
    hashtag_mode: profile.hashtagMode,
    manual_hashtag: profile.manualHashtag,
    colors: profile.colors,
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
  return profile;
}

async function insertLocal(key, row) {
  const state = loadLocal();
  const item = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
  state[key] = [item, ...(state[key] || [])]; saveLocal(state); return item;
}

export async function addFood(userId, row) {
  if (!isSupabaseConfigured || !userId) return insertLocal('foods', row);
  const { data, error } = await supabase.from('food_logs').insert({ user_id: userId, ...row }).select().single();
  if (error) throw error; return data;
}

export async function addActivity(userId, row) {
  if (!isSupabaseConfigured || !userId) return insertLocal('activities', row);
  const { data, error } = await supabase.from('activity_logs').insert({ user_id: userId, ...row }).select().single();
  if (error) throw error; return data;
}

export async function addMenu(userId, row) {
  if (!isSupabaseConfigured || !userId) return insertLocal('menus', row);
  const { data, error } = await supabase.from('food_presets').insert({ user_id: userId, ...row }).select().single();
  if (error) throw error; return data;
}

export async function updateLog(kind, userId, id, patch) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal();
    const key = kind === 'food' ? 'foods' : 'activities';
    state[key] = state[key].map(x => x.id === id ? { ...x, ...patch } : x); saveLocal(state); return;
  }
  const table = kind === 'food' ? 'food_logs' : 'activity_logs';
  const { error } = await supabase.from(table).update(patch).eq('id', id); if (error) throw error;
}

export async function deleteLog(kind, userId, id) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal(); const key = kind === 'food' ? 'foods' : 'activities';
    state[key] = state[key].filter(x => x.id !== id); saveLocal(state); return;
  }
  const table = kind === 'food' ? 'food_logs' : 'activity_logs';
  const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error;
}

export async function startFast(userId, startedAt) {
  if (!isSupabaseConfigured || !userId) return insertLocal('fasting', { started_at: startedAt, ended_at: null });
  const { data, error } = await supabase.from('fasting_sessions').insert({ user_id: userId, started_at: startedAt }).select().single();
  if (error) throw error; return data;
}

export async function endFast(userId, id, endedAt) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal(); state.fasting = state.fasting.map(x => x.id === id ? { ...x, ended_at: endedAt } : x); saveLocal(state); return;
  }
  const { error } = await supabase.from('fasting_sessions').update({ ended_at: endedAt }).eq('id', id); if (error) throw error;
}

export async function deleteFast(userId, id) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal(); state.fasting = state.fasting.filter(x => x.id !== id); saveLocal(state); return;
  }
  const { error } = await supabase.from('fasting_sessions').delete().eq('id', id); if (error) throw error;
}

export async function deleteMenu(userId, id) {
  if (!isSupabaseConfigured || !userId) {
    const state = loadLocal(); state.menus = state.menus.filter(x => x.id !== id); saveLocal(state); return;
  }
  const { error } = await supabase.from('food_presets').delete().eq('id', id); if (error) throw error;
}
