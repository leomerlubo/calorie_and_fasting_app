import { createClient } from '@supabase/supabase-js';

const CONFIG_URL='https://ohgaffedkbmbkuuqthge.supabase.co/functions/v1/selflove-config';
let clientPromise;

export function getSupabase(){
  if(!clientPromise){
    clientPromise=fetch(CONFIG_URL,{cache:'no-store'})
      .then(async response=>{
        if(!response.ok)throw new Error(`Supabase config failed (${response.status})`);
        const {url,publishableKey}=await response.json();
        if(!url||!publishableKey)throw new Error('Supabase config is incomplete');
        return createClient(url,publishableKey,{
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
        });
      });
  }
  return clientPromise;
}
