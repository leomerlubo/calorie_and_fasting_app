import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_CATALOG, DAILY_HASHTAGS, FASTING_STAGES } from './data/activities.js';
import {
  DEFAULT_PROFILE,
  DEFAULT_THEME,
  calculateAge,
  calculateBmr,
  calculateTdee,
  combineLocalDateTime,
  dateKey,
  formatDuration,
  localDateTimeParts,
  minutesBetween,
  prettyDate,
} from './lib/domain.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import {
  addActivity,
  addFood,
  addMenu,
  deleteLog,
  deleteMenu,
  endFast,
  loadUserData,
  saveProfile,
  startFast,
  updateLog,
} from './lib/store.js';

const PREVIEW_USER = { id: 'preview-user', email: 'preview@local' };

function Icon({ name, size = 24 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 13l3-3M12 5V3"/></>,
    fork: <><path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10M9.5 3v4.5A2.5 2.5 0 0 1 7 10v11M16 3v18M16 3c3 2 4 5 4 8h-4"/></>,
    activity: <><path d="M6 7l3-3 2 2-3 3 2 2 3-3 2 2-3 3 2 2 3-3 2 2-3 3-2-2-3 3-2-2 3-3-2-2-3 3-2-2 3-3-2-2z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    left: <path d="M15 18l-6-6 6-6"/>,
    right: <path d="M9 18l6-6-6-6"/>,
    close: <path d="M6 6l12 12M18 6L6 18"/>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
    hash: <><path d="M10 3L8 21M16 3l-2 18M4 9h16M3 15h16"/></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3.3-4-6-9-6z"/><circle cx="7" cy="9" r=".7" fill="currentColor"/><circle cx="10" cy="6.5" r=".7" fill="currentColor"/><circle cx="15" cy="7" r=".7" fill="currentColor"/></>,
  };
  return <svg {...common}>{paths[name] || paths.clock}</svg>;
}

function Modal({ children, onClose, wide = false }) {
  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
    <div className={`modal ${wide ? 'wide' : ''}`}>
      {onClose && <button className="modal-close" onClick={onClose}><Icon name="close"/></button>}
      {children}
    </div>
  </div>;
}

function Button({ children, className = '', ...props }) {
  return <button className={`primary-button ${className}`} {...props}>{children}</button>;
}

function Login({ onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      if (!isSupabaseConfigured) {
        localStorage.setItem('myWellness.previewSignedIn', '1');
        onSignedIn(PREVIEW_USER); return;
      }
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) onSignedIn(data.user);
        else setMessage('Check your email to confirm your account.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error; onSignedIn(data.user);
      }
    } catch (err) { setMessage(err.message || 'Unable to continue.'); }
    finally { setBusy(false); }
  }

  async function google() {
    if (!isSupabaseConfigured) { localStorage.setItem('myWellness.previewSignedIn', '1'); onSignedIn(PREVIEW_USER); return; }
    const redirectTo = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setMessage(error.message);
  }

  async function forgot() {
    if (!email) { setMessage('Enter your email first.'); return; }
    if (!isSupabaseConfigured) { setMessage('Password reset will be available after Supabase is connected.'); return; }
    const redirectTo = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setMessage(error ? error.message : 'Password reset email sent.');
  }

  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="selflove-mark">#SelfLove</div>
      <h1>Welcome to #TheSelfLoveApp</h1>
      <p className="login-sub">{mode === 'signup' ? 'Create your account' : 'Sign in to continue'}</p>
      <button type="button" className="google-button" onClick={google}><span className="google-g">G</span> Continue with Google</button>
      <div className="or"><span/>OR<span/></div>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength="6" required /></label>
      <Button disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}</Button>
      {mode === 'signin' && <button type="button" className="text-button" onClick={forgot}>Forgot password?</button>}
      <button type="button" className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>
        {mode === 'signin' ? <>Need an account? <b>Sign up</b></> : <>Already have an account? <b>Sign in</b></>}
      </button>
      {!isSupabaseConfigured && <p className="dev-note">Backend not connected yet. Sign in opens the local preview.</p>}
      {message && <p className="form-message">{message}</p>}
    </form>
  </div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState({ profile: DEFAULT_PROFILE, foods: [], activities: [], menus: [], fasting: [] });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('calories');
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (localStorage.getItem('myWellness.previewSignedIn') === '1') setUser(PREVIEW_USER);
      setAuthLoading(false); return;
    }
    supabase.auth.getSession().then(({ data: s }) => { setUser(s.session?.user || null); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function reload() {
    if (!user) return;
    setLoading(true); setError('');
    try { const next = await loadUserData(user.id); setData(next); }
    catch (err) { setError(err.message || 'Could not load data.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, [user?.id]);

  const profile = data.profile || DEFAULT_PROFILE;
  const theme = { ...DEFAULT_THEME, ...(profile.colors || {}) };
  const cssVars = {
    '--bg': theme.background,
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--tab-bg': theme.tabBackground,
    '--text-primary': theme.textPrimary,
    '--text-secondary': theme.textSecondary,
    '--progress': theme.progressBar,
    '--food': theme.foodButton,
    '--activity': theme.activityButton,
  };

  if (authLoading) return <div className="splash">My Wellness</div>;
  if (!user) return <Login onSignedIn={setUser}/>;

  async function logout() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    else { localStorage.removeItem('myWellness.previewSignedIn'); setUser(null); }
  }

  async function applyProfile(next) {
    try { await saveProfile(user.id, next); setData(d => ({ ...d, profile: next })); setModal(null); }
    catch (err) { setError(err.message); }
  }

  const today = dateKey();
  const dayFoods = data.foods.filter(x => x.log_date === selectedDate);
  const dayActivities = data.activities.filter(x => x.log_date === selectedDate);
  const consumed = dayFoods.reduce((s, x) => s + Number(x.calories || 0), 0);
  const burned = dayActivities.reduce((s, x) => s + Number(x.calories_burned || 0), 0);
  const goal = Number(profile.calorieGoal || 1800);
  const caloriesLeft = goal - consumed + burned;
  const netUsed = Math.max(0, consumed - burned);
  const progress = Math.max(0, Math.min(1, netUsed / Math.max(goal, 1)));
  const hashtag = profile.hashtagMode === 'manual' && profile.manualHashtag
    ? profile.manualHashtag
    : DAILY_HASHTAGS[new Date().getDate() - 1] || '#HealthFirst';

  function shiftDate(delta) {
    const d = new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate() + delta);
    const next = dateKey(d); if (next <= today) setSelectedDate(next);
  }

  const combinedLogs = [
    ...dayFoods.map(x => ({ ...x, kind: 'food', label: x.name, value: Number(x.calories), sign: '+' })),
    ...dayActivities.map(x => ({ ...x, kind: 'activity', label: x.name, value: Number(x.calories_burned), sign: '-' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return <div className="app" style={cssVars}>
    <header className="dashboard-header">
      <div>
        <div className="hashtag">{hashtag}</div>
        <div className="greeting">Good {greeting()}, <strong>{profile.name || 'Friend'}</strong></div>
      </div>
      <div className="header-actions">
        <button onClick={() => setModal({ type: 'timer' })}><Icon name="timer" size={28}/></button>
        <button onClick={() => setModal({ type: 'settings' })}><Icon name="gear" size={28}/></button>
      </div>
    </header>

    <main className="dashboard-main">
      <div className="segment"><button className={tab === 'calories' ? 'active' : ''} onClick={() => setTab('calories')}>Calories</button><button className={tab === 'fasting' ? 'active' : ''} onClick={() => setTab('fasting')}>Fasting</button></div>
      {error && <div className="error-banner">{error}</div>}
      {loading ? <div className="loading-card">Loading…</div> : tab === 'calories' ? <CaloriesTab
        selectedDate={selectedDate} today={today} shiftDate={shiftDate} setSelectedDate={setSelectedDate}
        consumed={consumed} burned={burned} caloriesLeft={caloriesLeft} goal={goal} progress={progress}
        logs={combinedLogs} onFood={() => setModal({ type: 'food' })} onActivity={() => setModal({ type: 'activity' })}
        onEdit={entry => setModal({ type: entry.kind, editing: entry })}
        onDelete={async entry => { if (confirm(`Delete ${entry.label}?`)) { await deleteLog(entry.kind, user.id, entry.id); await reload(); } }}
      /> : <FastingTab data={data.fasting} onStart={() => setModal({ type: 'start-fast' })} onStop={fast => setModal({ type: 'stop-fast', fast })}/>} 
    </main>

    {modal?.type === 'food' && <FoodModal user={user} menus={data.menus} selectedDate={selectedDate} editing={modal.editing} seed={modal.seed} onClose={() => setModal(null)} onSaved={reload} setModal={setModal}/>} 
    {modal?.type === 'menu-picker' && <MenuPicker menus={data.menus} onPick={menu => setModal({ type: 'food', seed: menu })} onClose={() => setModal({ type: 'food' })}/>} 
    {modal?.type === 'activity' && <ActivityModal user={user} selectedDate={selectedDate} editing={modal.editing} seed={modal.seed} onClose={() => setModal(null)} onSaved={reload} setModal={setModal}/>} 
    {modal?.type === 'activity-picker' && <ActivityPicker onPick={item => setModal({ type: 'activity', seed: item })} onClose={() => setModal({ type: 'activity' })}/>} 
    {modal?.type === 'settings' && <Settings profile={profile} onClose={() => setModal(null)} setModal={setModal} onLogout={logout}/>} 
    {modal?.type === 'profile' && <ProfileModal profile={profile} onClose={() => setModal({ type: 'settings' })} onSave={applyProfile}/>} 
    {modal?.type === 'goal' && <GoalModal profile={profile} onClose={() => setModal({ type: 'settings' })} onSave={applyProfile}/>} 
    {modal?.type === 'timezone' && <TimezoneModal profile={profile} onClose={() => setModal({ type: 'settings' })} onSave={applyProfile}/>} 
    {modal?.type === 'menus' && <MenusModal user={user} menus={data.menus} onClose={() => setModal({ type: 'settings' })} onChanged={reload}/>} 
    {modal?.type === 'hashtag' && <HashtagModal profile={profile} hashtag={hashtag} onClose={() => setModal({ type: 'settings' })} onSave={applyProfile}/>} 
    {modal?.type === 'colors' && <ColorsModal profile={profile} onClose={() => setModal({ type: 'settings' })} onSave={applyProfile}/>} 
    {modal?.type === 'timer' && <TimerModal onClose={() => setModal(null)}/>} 
    {modal?.type === 'start-fast' && <StartFastModal user={user} onClose={() => setModal(null)} onSaved={reload}/>} 
    {modal?.type === 'stop-fast' && <StopFastModal user={user} fast={modal.fast} onClose={() => setModal(null)} onSaved={reload}/>} 
  </div>;
}

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'; }

function CaloriesTab({ selectedDate, today, shiftDate, setSelectedDate, consumed, burned, caloriesLeft, goal, progress, logs, onFood, onActivity, onEdit, onDelete }) {
  const r = 86; const c = 2 * Math.PI * r;
  return <>
    <div className="date-nav"><button onClick={() => shiftDate(-1)}><Icon name="left"/></button><label className="date-pill">{prettyDate(selectedDate)}<input type="date" max={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></label><button disabled={selectedDate >= today} onClick={() => shiftDate(1)}><Icon name="right"/></button></div>
    <div className="calorie-ring">
      <svg viewBox="0 0 200 200"><circle className="ring-track" cx="100" cy="100" r={r}/><circle className="ring-progress" cx="100" cy="100" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - progress)}/></svg>
      <div className="ring-copy"><strong>{caloriesLeft}</strong><span>calories left</span><small>Goal: {goal}</small></div>
    </div>
    <div className="stat-grid"><div className="stat consumed"><strong>{consumed}</strong><span>CONSUMED</span></div><div className="stat burned"><strong>{burned}</strong><span>BURNED</span></div></div>
    <div className="action-grid"><button className="food" onClick={onFood}>＋ <span>FOOD</span></button><button className="activity" onClick={onActivity}>＋ <span>ACTIVITY</span></button></div>
    <h3 className="section-title">TODAY'S LOG</h3>
    <div className="log-card">{logs.length === 0 ? <div className="empty">No entries yet today</div> : logs.map(entry => <div className="log-row" key={`${entry.kind}-${entry.id}`}>
      <div className={`log-icon ${entry.kind}`}><Icon name={entry.kind === 'food' ? 'fork' : 'activity'} size={22}/></div>
      <div className="log-label">{entry.label}</div><div className={`log-value ${entry.kind}`}>{entry.sign}{entry.value}</div>
      <button className="icon-action" onClick={() => onEdit(entry)}><Icon name="edit" size={20}/></button><button className="icon-action danger" onClick={() => onDelete(entry)}><Icon name="trash" size={20}/></button>
    </div>)}</div>
  </>;
}

function FoodModal({ user, menus, selectedDate, editing, seed: menuSeed, onClose, onSaved, setModal }) {
  const seed = editing || menuSeed || {};
  const [name, setName] = useState(seed.name || '');
  const [calories, setCalories] = useState(seed.calories || '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!name.trim() || !Number(calories)) return;
    setBusy(true);
    try {
      if (editing) await updateLog('food', user.id, editing.id, { name: name.trim(), calories: Number(calories) });
      else {
        await addFood(user.id, { log_date: selectedDate, name: name.trim(), calories: Number(calories) });
        const exists = menus.some(x => x.name.toLowerCase() === name.trim().toLowerCase());
        if (!exists && confirm(`Save "${name.trim()}" to your Saved Menus for quick access later?`)) await addMenu(user.id, { name: name.trim(), calories: Number(calories) });
      }
      await onSaved(); onClose();
    } finally { setBusy(false); }
  }
  return <Modal onClose={onClose}><div className="modal-title-line"><div className="modal-badge food"><Icon name="fork"/></div><h2>{editing ? 'Edit Food' : 'Log Food'}</h2></div>
    <label>What did you eat?<button className="inline-link" onClick={() => setModal({ type: 'menu-picker' })}>▣ Menu</button><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Chicken Salad"/></label>
    <label>Calories consumed<input type="number" min="1" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g., 350"/></label>
    <Button onClick={save} disabled={busy}>{editing ? 'Save Changes' : 'Add Food Entry'}</Button>
  </Modal>;
}

function MenuPicker({ menus, onPick, onClose }) {
  const [q, setQ] = useState(''); const filtered = menus.filter(x => x.name.toLowerCase().includes(q.toLowerCase()));
  return <Modal onClose={onClose}><div className="modal-title-line"><div className="modal-badge food"><Icon name="fork"/></div><h2>Saved Menus</h2></div><div className="search"><Icon name="search"/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search menus..."/></div><div className="picker-list">{filtered.map(x => <button key={x.id} onClick={() => onPick(x)}><b>{x.name}</b><span>{x.calories} cal</span></button>)}</div></Modal>;
}

function ActivityModal({ user, selectedDate, editing, seed, onClose, onSaved, setModal }) {
  const initial = editing || seed || {};
  const [name, setName] = useState(initial.name || '');
  const [hours, setHours] = useState(editing ? Math.floor(Number(editing.duration_minutes || 0) / 60) : 0);
  const [minutes, setMinutes] = useState(editing ? Number(editing.duration_minutes || 0) % 60 : 30);
  const rate = seed?.caloriesPerHour || 0;
  const estimated = rate ? Math.round(rate * (Number(hours) * 60 + Number(minutes)) / 60) : '';
  const [calories, setCalories] = useState(editing?.calories_burned || estimated || '');
  useEffect(() => { if (rate) setCalories(Math.round(rate * (Number(hours) * 60 + Number(minutes)) / 60)); }, [hours, minutes, rate]);
  async function save() {
    const duration = Number(hours) * 60 + Number(minutes); if (!name.trim() || duration <= 0 || !Number(calories)) return;
    const patch = { name: name.trim(), duration_minutes: duration, calories_burned: Number(calories) };
    if (editing) await updateLog('activity', user.id, editing.id, patch); else await addActivity(user.id, { log_date: selectedDate, ...patch });
    await onSaved(); onClose();
  }
  return <Modal onClose={onClose}><div className="modal-title-line"><div className="modal-badge activity"><Icon name="activity"/></div><h2>{editing ? 'Edit Activity' : 'Log Activity'}</h2></div>
    <label>What activity?<button className="inline-link green" onClick={() => setModal({ type: 'activity-picker' })}>▣ Activities</button><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Walking"/></label>
    <label>Duration<div className="duration-row"><input type="number" min="0" value={hours} onChange={e => setHours(e.target.value)}/><span>hrs</span><input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)}/><span>min</span></div></label>
    <label>Calories burned {rate ? <small>(estimated)</small> : null}<input type="number" min="1" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g., 350"/></label>
    <Button className="green-button" onClick={save}>{editing ? 'Save Changes' : 'Add Activity'}</Button>
  </Modal>;
}

function ActivityPicker({ onPick, onClose }) {
  const [q, setQ] = useState(''); const filtered = ACTIVITY_CATALOG.filter(x => `${x.name} ${x.detail}`.toLowerCase().includes(q.toLowerCase()));
  return <Modal onClose={onClose}><h2>Select Activity</h2><div className="search"><Icon name="search"/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search activities..."/></div><div className="picker-list activity-list">{filtered.map(x => <button key={x.name} onClick={() => onPick(x)}><div><b>{x.name}</b><small>{x.detail}</small></div><span>~{x.caloriesPerHour}/hr</span></button>)}</div></Modal>;
}

function FastingTab({ data, onStart, onStop }) {
  const [, forceTick] = useState(0);
  useEffect(() => { const id = setInterval(() => forceTick(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const active = data.find(x => !x.ended_at);
  const completed = data.filter(x => x.ended_at);
  const durations = completed.map(x => minutesBetween(x.started_at, x.ended_at));
  const longest = durations.length ? Math.max(...durations) : 0; const total = durations.reduce((a, b) => a + b, 0);
  if (!active) return <>
    <div className="fast-ready"><h2>Ready to Fast?</h2><p>Start your fasting timer to track your progress through different fasting stages.</p><Button onClick={onStart}>Start Fasting</Button></div>
    <FastingHistory completed={completed} longest={longest} total={total}/>
  </>;
  const elapsedMin = minutesBetween(active.started_at); const elapsedH = elapsedMin / 60;
  const reached = [...FASTING_STAGES].filter(x => elapsedH >= x.hours).pop(); const next = FASTING_STAGES.find(x => elapsedH < x.hours);
  const stageName = reached?.name || 'Fasting'; const nextRemaining = next ? Math.max(0, next.hours * 60 - elapsedMin) : 0;
  const sec = Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000) % 60;
  return <>
    <div className="fast-active"><div className="stage-pill">{stageName}</div><div className="fast-clock"><strong>{String(Math.floor(elapsedMin / 60)).padStart(2, '0')}:{String(elapsedMin % 60).padStart(2, '0')}</strong><span>:{String(sec).padStart(2, '0')}</span></div>
      {next && <div className="next-stage"><b>Next: {next.name}</b><span>{formatDuration(nextRemaining)} to go</span><div className="mini-progress"><i style={{ width: `${Math.min(100, elapsedH / next.hours * 100)}%` }}/></div></div>}
      <button className="stop-button" onClick={() => onStop(active)}>Stop Fasting</button></div>
    <div className="stages-card"><h3>FASTING STAGES</h3>{FASTING_STAGES.map(stage => { const done = elapsedH >= stage.hours; const current = next?.hours === stage.hours; return <div key={stage.hours} className={`stage-row ${done ? 'done' : current ? 'current' : ''}`}><div className="stage-icon">{done ? '✓' : stage.hours >= 72 ? '💪' : stage.hours >= 48 ? '🌌' : '○'}</div><div><b>{stage.name}</b><span>{stage.description}</span></div><strong>{stage.hours}h</strong></div>; })}</div>
    <FastingHistory completed={completed} longest={longest} total={total}/>
  </>;
}

function FastingHistory({ completed, longest, total }) {
  return <div className="fast-history"><div className="fast-stats"><div><span>🏆</span><strong>{formatDuration(longest)}</strong><small>Longest Fast</small></div><div><span>◷</span><strong>{formatDuration(total)}</strong><small>Total Fasting</small></div></div><h3>RECENT SESSIONS</h3>{completed.length === 0 ? <div className="empty">No fasting sessions yet</div> : completed.slice(0, 6).map(x => { const mins = minutesBetween(x.started_at, x.ended_at); return <div className="session-row" key={x.id}><div className="session-icon"><Icon name="clock"/></div><div><b>{formatDuration(mins)}</b><span>{new Date(x.started_at).toLocaleString()}</span></div>{mins >= 1440 && <em>24h+ 🎉</em>}</div>; })}</div>;
}

function StartFastModal({ user, onClose, onSaved }) {
  const parts = localDateTimeParts(); const [date, setDate] = useState(parts.date); const [time, setTime] = useState(parts.time);
  async function save() { await startFast(user.id, combineLocalDateTime(date, time)); await onSaved(); onClose(); }
  return <Modal onClose={onClose}><h2>Start Fasting</h2><p className="center-muted">When did you start fasting? Default is the current time.</p><label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)}/></label><label>Date<input type="date" max={dateKey()} value={date} onChange={e => setDate(e.target.value)}/></label><Button onClick={save}>Start</Button><button className="secondary-button" onClick={onClose}>Cancel</button></Modal>;
}

function StopFastModal({ user, fast, onClose, onSaved }) {
  const parts = localDateTimeParts(); const [date, setDate] = useState(parts.date); const [time, setTime] = useState(parts.time); const mins = minutesBetween(fast.started_at);
  async function save() { await endFast(user.id, fast.id, combineLocalDateTime(date, time)); await onSaved(); onClose(); }
  return <Modal onClose={onClose}><h2>End Fasting Session</h2><p className="center-muted">You've been fasting for {formatDuration(mins)}. When did you end your fast?</p><label>End Time<input type="time" value={time} onChange={e => setTime(e.target.value)}/></label><label>End Date<input type="date" max={dateKey()} value={date} onChange={e => setDate(e.target.value)}/></label><Button className="red-button" onClick={save}>End Session</Button><button className="secondary-button" onClick={onClose}>Continue Fasting</button></Modal>;
}

function Settings({ profile, onClose, setModal, onLogout }) {
  return <div className="settings-page"><div className="settings-header"><button onClick={onClose}><Icon name="left"/></button><div><h1><Icon name="gear" size={30}/> Settings</h1><p>Manage your profile and preferences</p></div></div><div className="settings-card">
    <SettingRow icon="user" title="Profile" value={profile.name || 'Set up'} onClick={() => setModal({ type: 'profile' })}/>
    <SettingRow icon="target" title="Calorie Goal" value={`${profile.calorieGoal} kcal`} onClick={() => setModal({ type: 'goal' })}/>
    <SettingRow icon="clock" title="Timezone" value={profile.timezone} onClick={() => setModal({ type: 'timezone' })}/>
    <SettingRow icon="fork" title="Saved Menus" value="Manage" onClick={() => setModal({ type: 'menus' })}/>
    <SettingRow icon="hash" title="Hashtag" value={profile.hashtagMode === 'manual' ? profile.manualHashtag : 'Auto'} onClick={() => setModal({ type: 'hashtag' })}/>
    <SettingRow icon="palette" title="Colors" value={<div className="color-dots"><i style={{background: profile.colors?.primary}}/><i style={{background: profile.colors?.secondary}}/><i style={{background: profile.colors?.foodButton}}/></div>} onClick={() => setModal({ type: 'colors' })}/>
    <Button onClick={onClose}>Save Settings</Button><button className="text-button danger-text" onClick={onLogout}>Sign out</button>
  </div></div>;
}
function SettingRow({ icon, title, value, onClick }) { return <button className="setting-row" onClick={onClick}><div className="setting-icon"><Icon name={icon}/></div><b>{title}</b><span>{value}</span><Icon name="right" size={20}/></button>; }

function ProfileModal({ profile, onClose, onSave }) {
  const [p, setP] = useState({ ...profile }); const bmr = calculateBmr(p); const tdee = calculateTdee(p);
  return <Modal onClose={onClose} wide><h2>Profile</h2><label>Name<input value={p.name} onChange={e => setP({ ...p, name: e.target.value })}/></label><div className="two-col"><label>Height (cm)<input type="number" value={p.heightCm} onChange={e => setP({ ...p, heightCm: e.target.value })}/></label><label>Weight (kg)<input type="number" value={p.weightKg} onChange={e => setP({ ...p, weightKg: e.target.value })}/></label></div><label>Date of Birth<input type="date" value={p.dob} onChange={e => setP({ ...p, dob: e.target.value })}/><small>Age: {calculateAge(p.dob)} years old</small></label><label>Gender<select value={p.gender} onChange={e => setP({ ...p, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option></select></label><label>Activity Level<select value={p.activityLevel} onChange={e => setP({ ...p, activityLevel: e.target.value })}><option value="sedentary">Sedentary</option><option value="light">Lightly Active</option><option value="moderate">Moderately Active</option><option value="very">Very Active</option><option value="extra">Extra Active</option></select></label><div className="bmr-box">BMR: <b>{bmr}</b> | TDEE: <b>{tdee}</b> kcal/day</div><Button onClick={() => onSave(p)}>Done</Button></Modal>;
}

function GoalModal({ profile, onClose, onSave }) {
  const suggested = calculateTdee(profile); const [useSuggested, setUse] = useState(profile.useSuggestedGoal); const [custom, setCustom] = useState(profile.calorieGoal);
  function done() { onSave({ ...profile, useSuggestedGoal: useSuggested, calorieGoal: useSuggested ? suggested : Number(custom) }); }
  return <Modal onClose={onClose}><h2>Calorie Goal</h2><label className={`choice ${useSuggested ? 'selected' : ''}`}><input type="radio" checked={useSuggested} onChange={() => setUse(true)}/><div><b>Use Suggested <span className="green-text">{suggested} kcal</span></b></div></label><label className={`choice ${!useSuggested ? 'selected' : ''}`}><input type="radio" checked={!useSuggested} onChange={() => setUse(false)}/><div><b>Set Custom</b><input type="number" value={custom} onChange={e => setCustom(e.target.value)}/></div></label><Button onClick={done}>Done</Button></Modal>;
}

function TimezoneModal({ profile, onClose, onSave }) {
  const [tz, setTz] = useState(profile.timezone);
  return <Modal onClose={onClose}><h2>Timezone</h2><select value={tz} onChange={e => setTz(e.target.value)}><option value="Asia/Manila">GMT+8 (Philippines/Singapore)</option><option value="America/New_York">US Eastern</option><option value="America/Chicago">US Central</option><option value="America/Denver">US Mountain</option><option value="America/Los_Angeles">US Pacific</option><option value="Europe/London">London</option><option value="Asia/Tokyo">Tokyo</option><option value="Australia/Sydney">Sydney</option></select><p className="muted">Used for daily calorie reset at midnight</p><Button onClick={() => onSave({ ...profile, timezone: tz })}>Done</Button></Modal>;
}

function MenusModal({ user, menus, onClose, onChanged }) {
  const [adding, setAdding] = useState(false); const [name, setName] = useState(''); const [calories, setCalories] = useState('');
  async function save() { if (!name.trim() || !Number(calories)) return; await addMenu(user.id, { name: name.trim(), calories: Number(calories) }); setName(''); setCalories(''); setAdding(false); await onChanged(); }
  return <Modal onClose={onClose} wide><h2>Saved Menus</h2>{!adding ? <button className="secondary-button" onClick={() => setAdding(true)}>＋ Add New Dish</button> : <div className="add-menu-box"><label>Dish Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Chicken Salad"/></label><label>Default Calories<input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g., 350"/></label><div className="two-col"><button className="secondary-button" onClick={() => setAdding(false)}>Cancel</button><Button onClick={save}>Save</Button></div></div>}<div className="picker-list manage-list">{menus.map(x => <div key={x.id}><div><b>{x.name}</b><span>{x.calories} cal</span></div><button className="icon-action danger" onClick={async () => { if (confirm(`Delete ${x.name}?`)) { await deleteMenu(user.id, x.id); await onChanged(); } }}><Icon name="trash" size={18}/></button></div>)}</div><Button onClick={onClose}>Done</Button></Modal>;
}

function HashtagModal({ profile, hashtag, onClose, onSave }) {
  const [mode, setMode] = useState(profile.hashtagMode); const [manual, setManual] = useState(profile.manualHashtag || '#HealthFirst');
  return <Modal onClose={onClose}><h2>App Hashtag</h2><label className={`choice ${mode === 'auto' ? 'selected' : ''}`}><input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')}/><div><b>Auto (Daily)</b><span>Changes daily, repeats monthly</span><strong>Today: {hashtag}</strong></div></label><label className={`choice ${mode === 'manual' ? 'selected' : ''}`}><input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')}/><div><b>Manual</b><span>Set your own hashtag</span>{mode === 'manual' && <input value={manual} onChange={e => setManual(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}/>}</div></label><Button onClick={() => onSave({ ...profile, hashtagMode: mode, manualHashtag: manual })}>Done</Button></Modal>;
}

function ColorsModal({ profile, onClose, onSave }) {
  const [colors, setColors] = useState({ ...DEFAULT_THEME, ...(profile.colors || {}) });
  const labels = { background: 'Background', primary: 'Primary', secondary: 'Secondary', tabBackground: 'Tab Background', textPrimary: 'Text Primary', textSecondary: 'Text Secondary', progressBar: 'Progress Bar', foodButton: 'Food Button', activityButton: 'Activity Button' };
  return <Modal onClose={onClose} wide><h2>Display Colors</h2><div className="color-grid">{Object.keys(labels).map(k => <label key={k}>{labels[k]}<div className="color-input"><input type="color" value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}/><input value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}/></div></label>)}</div><button className="secondary-button" onClick={() => setColors(DEFAULT_THEME)}>Reset to Default</button><div className="two-col"><button className="secondary-button" onClick={onClose}>Cancel</button><Button onClick={() => onSave({ ...profile, colors })}>OK</Button></div></Modal>;
}

function TimerModal({ onClose }) {
  const [h, setH] = useState(0), [m, setM] = useState(0), [s, setS] = useState(0); const [remaining, setRemaining] = useState(0); const [running, setRunning] = useState(false); const endRef = useRef(null);
  useEffect(() => { if (!running) return; const id = setInterval(() => { const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)); setRemaining(left); if (!left) { setRunning(false); navigator.vibrate?.([180, 100, 300]); } }, 250); return () => clearInterval(id); }, [running]);
  function start() { const total = Number(h) * 3600 + Number(m) * 60 + Number(s); if (!total) return; endRef.current = Date.now() + total * 1000; setRemaining(total); setRunning(true); }
  const shown = running ? remaining : Number(h) * 3600 + Number(m) * 60 + Number(s); const hh = Math.floor(shown / 3600), mm = Math.floor((shown % 3600) / 60), ss = shown % 60;
  return <Modal onClose={onClose}><h2 className="timer-title">Timer</h2>{running ? <div className="timer-display">{String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div> : <div className="timer-inputs"><input type="number" min="0" max="99" value={h} onChange={e => setH(e.target.value)}/><b>:</b><input type="number" min="0" max="59" value={m} onChange={e => setM(e.target.value)}/><b>:</b><input type="number" min="0" max="59" value={s} onChange={e => setS(e.target.value)}/></div>}<Button className="timer-start" onClick={() => running ? setRunning(false) : start()}>{running ? 'Pause' : '▷ Start'}</Button></Modal>;
}

export default App;
