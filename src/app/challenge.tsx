import {useEffect,useRef,useState} from 'react';
let scriptPromise:Promise<void>|undefined;
function script(){return scriptPromise??=(new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=()=>resolve();s.onerror=()=>{scriptPromise=undefined;s.remove();reject(Error('Verification could not load.'));};document.head.appendChild(s);}));}
export function Challenge({reset,onToken}:{reset:number;onToken:(token:string)=>void}){
 const node=useRef<HTMLDivElement>(null),callback=useRef(onToken);callback.current=onToken;
 const [error,setError]=useState('');
 useEffect(()=>{let cancelled=false,id:string|undefined;setError('');callback.current('');
 fetch('/api/config',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(async config=>{if(!config.turnstileSiteKey)return;await script();if(cancelled||!node.current)return;id=(window as any).turnstile.render(node.current,{sitekey:config.turnstileSiteKey,action:'submit',callback:(t:string)=>callback.current(t),'expired-callback':()=>callback.current(''),'error-callback':()=>{callback.current('');setError('Verification failed. Please retry.')}});}).catch(()=>{if(!cancelled)setError('Verification could not load. Reload to retry.');});
 return()=>{cancelled=true;if(id!==undefined)(window as any).turnstile?.remove(id)};
 },[reset]);
 return <div><div ref={node}/>{error&&<p role="alert">{error}</p>}</div>;
}
