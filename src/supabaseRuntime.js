import { createClient } from '@supabase/supabase-js';

const CONFIG_URL='https://ohgaffedkbmbkuuqthge.supabase.co/functions/v1/selflove-config';
let clientPromise;

async function fetchConfig(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(CONFIG_URL,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`Supabase config failed (${response.status})`);
    const {url,publishableKey}=await response.json();
    if(!url||!publishableKey)throw new Error('Supabase config is incomplete');
    return {url,publishableKey};
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Supabase connection timed out. Please check your internet connection and try again.');
    throw error;
  }finally{clearTimeout(timer)}
}

export function getSupabase(){
  if(!clientPromise){
    clientPromise=fetchConfig()
      .then(({url,publishableKey})=>createClient(url,publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
      }))
      .catch(error=>{clientPromise=null;throw error});
  }
  return clientPromise;
}
