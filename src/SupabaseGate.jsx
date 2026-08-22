import React,{useEffect,useRef,useState}from'react';
import TestAppV3 from './TestAppV3.jsx';
import {isSupabaseConfigured,supabase} from './lib/supabase.js';
import {loadCloudState,normalizeLocalState,syncCloudState} from './cloudSync.js';

const KEY='selfLove.preview.v3';
const AUTH='selfLove.previewSignedIn';
const readLocal=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const writeLocal=s=>localStorage.setItem(KEY,JSON.stringify(s));

function SignIn(){
  const[email,setEmail]=useState('');
  const[code,setCode]=useState('');
  const[sent,setSent]=useState(false);
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState(false);
  async function send(){setBusy(true);setMsg('');const{error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true}});if(error)setMsg(error.message);else{setSent(true);setMsg('Enter the code sent to your email.')}setBusy(false)}
  async function verify(){setBusy(true);setMsg('');const{error}=await supabase.auth.verifyOtp({email,token:code,type:'email'});if(error)setMsg(error.message);setBusy(false)}
  return <div className="login"><div className="loginCard"><div className="heartLogo">♡</div><h1>Welcome to SelfLove</h1><p>Sign in to securely sync your wellness data.</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{sent&&<label>Verification code<input inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6 digit code"/></label>}<button className="signin" disabled={busy||!email||(sent&&!code)} onClick={sent?verify:send}>{busy?'Please wait…':sent?'Verify code':'Send sign in code'}</button>{sent&&<button className="link" onClick={()=>{setSent(false);setCode('');setMsg('')}}>Use a different email</button>}{msg&&<p style={{fontSize:13}}>{msg}</p>}</div></div>
}

export default function SupabaseGate(){
  const[session,setSession]=useState(undefined),[ready,setReady]=useState(!isSupabaseConfigured);
  const[last,setLast]=useRef(''),syncing=useRef(false);
  useEffect(()=>{if(!isSupabaseConfigured)return;let live=true;supabase.auth.getSession().then(({data})=>live&&setSession(data.session||null));const h=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>{live=false;h.data.subscription.unsubscribe()}},[]);
  useEffect(()=>{if(!isSupabaseConfigured){setReady(true);return}if(!session){localStorage.removeItem(AUTH);setReady(false);return}let stop=false;(async()=>{try{const local=normalizeLocalState(readLocal()),cloud=await loadCloudState(session.user.id),merged=cloud?{...local,...cloud,profile:{...(local.profile||{}),...(cloud.profile||{})}}:local;writeLocal(merged);localStorage.setItem(AUTH,'1');last.current=JSON.stringify(merged);if(!cloud)await syncCloudState(session.user.id,merged)}catch(e){console.error(e)}finally{if(!stop)setReady(true)}})();return()=>{stop=true}},[session?.user?.id]);
  useEffect(()=>{if(!isSupabaseConfigured||!session||!ready)return;const t=setInterval(async()=>{const raw=localStorage.getItem(KEY)||'{}';if(syncing.current||raw===last.current)return;syncing.current=true;try{const n=await syncCloudState(session.user.id,readLocal()),next=JSON.stringify(n);if(next!==raw)writeLocal(n);last.current=next}catch(e){console.error(e)}finally{syncing.current=false}},1200);return()=>clearInterval(t)},[session?.user?.id,ready]);
  if(!isSupabaseConfigured)return <TestAppV3/>;
  if(session===undefined||!ready&&session)return <div className="login"><div className="loginCard"><div className="heartLogo">♡</div><h1>SelfLove</h1><p>Connecting securely…</p></div></div>;
  if(!session)return <SignIn/>;
  return <TestAppV3/>;
}
