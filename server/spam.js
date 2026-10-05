// Never rely on a client-side challenge alone. Siteverify tokens are single-use.
export async function verifyChallenge(req,env,token,action,fetcher=fetch){
 const reject=(status,message)=>{throw Object.assign(new Error(message),{status})};
 if(!env.TURNSTILE_SITE_KEY&&!env.TURNSTILE_SECRET_KEY)return;
 if(!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY)reject(503,'Verification is temporarily unavailable.');
 if(typeof token!=='string'||!token||token.length>2048)reject(400,'Please complete the verification.');
 let result;
 try{const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:req.headers.get('cf-connecting-ip')||undefined}),signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();result=await response.json();}catch{reject(503,'Verification is temporarily unavailable. Please retry.');}
 if(!result.success||result.hostname!==new URL(req.url).hostname||result.action!==action)reject(400,'Verification expired or failed. Please try again.');
}
