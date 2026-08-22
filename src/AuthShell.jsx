import React,{useEffect,useRef,useState}from'react';
import TestAppV3 from './TestAppV3.jsx';
import {getSupabase} from './supabaseRuntime.js';
import {loadCloudState,normalizeLocalState,syncCloudState} from './cloudSync.js';

const KEY='selfLove.preview.v3';
const AUTH='selfLove.previewSignedIn';

function readLocal(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}

export default function AuthShell(){
 const[ready,setReady]=useState(false),[session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState('signin'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);const syncing=useRef(false),last=useRef('');
 useEffect(()=>{let sub;getSupabase().then(async sb=>{const {data}=await sb.auth.getSession();setSession(data.session||null);const listener=sb.auth.onAuthStateChange((_e,s)=>setSession(s));sub=listener.data.subscription;setReady(true)}).catch(e=>{setMsg(e.message);setReady(true)});return()=>sub?.unsubscribe()},[]);
 useEffect(()=>{if(!session?.user)return;let cancelled=false;const userId=session.user.id;(async()=>{try{const cloud=await loadCloudState(userId);if(cancelled)return;if(cloud){const local=readLocal();const merged={...local,...cloud,profile:{...(local.profile||{}),...(cloud.profile||{})}};localStorage.setItem(KEY,JSON.stringify(merged));last.current=JSON.stringify(merged)}else{const normalized=normalizeLocalState(readLocal());localStorage.setItem(KEY,JSON.stringify(normalized));await syncCloudState(userId,normalized);last.current=JSON.stringify(normalized)}localStorage.setItem(AUTH,'1')}catch(e){setMsg(e.message)}})();const t=setInterval(async()=>{if(syncing.current)return;const raw=localStorage.getItem(KEY)||'{}';if(raw===last.current)return;syncing.current=true;try{const state=normalizeLocalState(JSON.parse(raw));const normalized=JSON.stringify(state);if(normalized!==raw)localStorage.setItem(KEY,normalized);await syncCloudState(userId,state);last.current=normalized}catch(e){setMsg(e.message)}finally{syncing.current=false}},1500);return()=>{cancelled=true;clearInterval(t)}},[session]);
 async function submit(e){e.preventDefault();setBusy(true);setMsg('');try{const sb=await getSupabase();if(mode==='signup'){const {data,error}=await sb.auth.signUp({email,password});if(error)throw error;if(!data.session)setMsg('Account created. Check your email to confirm, then sign in.')}else{const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error}}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 if(!ready)return <div className="login"><div className="loginCard"><div className="heartLogo">♡</div><h1>SelfLove</h1><p>Connecting securely…</p></div></div>;
 if(session?.user)return <TestAppV3/>;
 return <div className="login"><form className="loginCard" onSubmit={submit}><div className="heartLogo">♡</div><h1>Welcome to SelfLove</h1><p>{mode==='signup'?'Create your account to sync your wellness data':'Sign in to sync your wellness data'}</p><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength="6" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label><button className="signin" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'}</button>{msg&&<p>{msg}</p>}<button type="button" className="link" onClick={()=>{setMode(mode==='signup'?'signin':'signup');setMsg('')}}>{mode==='signup'?'Already have an account? Sign in':'Need an account? Sign up'}</button></form></div>
}
