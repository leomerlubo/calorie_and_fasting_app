import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{installKeyboardFix}from'./keyboardFix.js';
import'./testv3.css';

installKeyboardFix();

function Boot(){
 const[Shell,setShell]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  import('./AuthShell.jsx')
   .then(mod=>{if(alive)setShell(()=>mod.default)})
   .catch(err=>{console.error('SelfLove startup failed',err);if(alive)setError(err?.message||String(err))});
  return()=>{alive=false};
 },[]);
 if(error)return <div className="login"><div className="loginCard"><div className="heartLogo">♡</div><h1>SelfLove</h1><p>Unable to start cloud connection.</p><p style={{fontSize:13,wordBreak:'break-word'}}>{error}</p><button className="signin" onClick={()=>location.reload()}>Try again</button></div></div>;
 if(!Shell)return <div className="login"><div className="loginCard"><div className="heartLogo">♡</div><h1>SelfLove</h1><p>Starting securely…</p></div></div>;
 return <Shell/>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Boot/></React.StrictMode>);
