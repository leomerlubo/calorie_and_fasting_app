import { supabase } from './lib/supabase.js';

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuid=()=>crypto.randomUUID?.()||`${Date.now().toString(16).padStart(8,'0')}-0000-4000-8000-${Math.random().toString(16).slice(2,14).padEnd(12,'0')}`;
const validId=id=>typeof id==='string'&&UUID_RE.test(id);

export function normalizeLocalState(state){
  const next={...state};
  for(const key of ['foods','activities','menus','fasting']){
    next[key]=(state?.[key]||[]).map(item=>({...item,id:validId(item.id)?item.id:uuid()}));
  }
  return next;
}

export async function loadCloudState(userId){
  const [profile,foods,activities,menus,fasting]=await Promise.all([
    supabase.from('profiles').select('*').eq('user_id',userId).maybeSingle(),
    supabase.from('food_logs').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
    supabase.from('activity_logs').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
    supabase.from('food_presets').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
    supabase.from('fasting_sessions').select('*').eq('user_id',userId).order('started_at',{ascending:false}),
  ]);
  const error=[profile,foods,activities,menus,fasting].find(x=>x.error)?.error;
  if(error)throw error;
  const hasData=Boolean(profile.data||(foods.data?.length)||(activities.data?.length)||(menus.data?.length)||(fasting.data?.length));
  if(!hasData)return null;
  const p=profile.data;
  return {
    profile:p?{
      name:p.name||'',heightCm:Number(p.height_cm)||160,weightKg:Number(p.weight_kg)||70,dob:p.dob||'1990-01-01',gender:p.gender||'male',activityLevel:p.activity_level||'sedentary',goal:Number(p.calorie_goal)||1800,useSuggested:Boolean(p.use_suggested_goal),timezone:p.timezone||'Asia/Manila',hashtagMode:p.hashtag_mode||'auto',manualHashtag:p.manual_hashtag||'#HealthFirst',colors:p.colors||{}
    }:undefined,
    foods:(foods.data||[]).map(x=>({id:x.id,name:x.name,cal:x.calories,date:x.log_date,created:x.created_at})),
    activities:(activities.data||[]).map(x=>({id:x.id,name:x.name,minutes:x.duration_minutes,cal:x.calories_burned,date:x.log_date,created:x.created_at})),
    menus:(menus.data||[]).map(x=>({id:x.id,name:x.name,cal:x.calories,created:x.created_at})),
    fasting:(fasting.data||[]).map(x=>({id:x.id,start:x.started_at,end:x.ended_at,created:x.created_at})),
  };
}

async function reconcile(table,userId,rows){
  const current=await supabase.from(table).select('id').eq('user_id',userId);
  if(current.error)throw current.error;
  if(rows.length){
    const upsert=await supabase.from(table).upsert(rows,{onConflict:'id'});
    if(upsert.error)throw upsert.error;
  }
  const wanted=new Set(rows.map(x=>x.id));
  const remove=(current.data||[]).map(x=>x.id).filter(id=>!wanted.has(id));
  if(remove.length){
    const del=await supabase.from(table).delete().eq('user_id',userId).in('id',remove);
    if(del.error)throw del.error;
  }
}

export async function syncCloudState(userId,input){
  const state=normalizeLocalState(input||{});
  const p=state.profile||{};
  const profile=await supabase.from('profiles').upsert({
    user_id:userId,
    name:p.name||'',
    height_cm:Number(p.heightCm)||160,
    weight_kg:Number(p.weightKg)||70,
    dob:p.dob||null,
    gender:p.gender||'male',
    activity_level:p.activityLevel||'sedentary',
    calorie_goal:Number(p.goal)||1800,
    use_suggested_goal:Boolean(p.useSuggested),
    timezone:p.timezone||'Asia/Manila',
    hashtag_mode:p.hashtagMode||'auto',
    manual_hashtag:p.manualHashtag||'#HealthFirst',
    colors:p.colors||{},
    updated_at:new Date().toISOString(),
  },{onConflict:'user_id'});
  if(profile.error)throw profile.error;

  await Promise.all([
    reconcile('food_logs',userId,(state.foods||[]).map(x=>({id:x.id,user_id:userId,log_date:x.date,name:x.name,calories:Number(x.cal)||1,created_at:x.created||new Date().toISOString()}))),
    reconcile('activity_logs',userId,(state.activities||[]).map(x=>({id:x.id,user_id:userId,log_date:x.date,name:x.name,duration_minutes:Number(x.minutes)||1,calories_burned:Number(x.cal)||1,created_at:x.created||new Date().toISOString()}))),
    reconcile('food_presets',userId,(state.menus||[]).map(x=>({id:x.id,user_id:userId,name:x.name,calories:Number(x.cal)||1,created_at:x.created||new Date().toISOString()}))),
    reconcile('fasting_sessions',userId,(state.fasting||[]).map(x=>({id:x.id,user_id:userId,started_at:x.start,ended_at:x.end||null,created_at:x.created||x.start||new Date().toISOString()}))),
  ]);
  return state;
}
