import {reviewIssues} from '../src/lib/review.js';
const uuid=()=>crypto.randomUUID();
export const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const clean=(s,n=200)=>typeof s==='string'?s.trim().slice(0,n):'';
function https(s){if(!s)return '';const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)throw Error('HTTPS URL required');return u.href;}
export function extendedInput(b){
 const recurrence=b.recurrence||'unknown';if(!['unknown','single','rule','range'].includes(recurrence))throw Error('Invalid recurrence');
 const rrule=clean(b.rrule,300);if(rrule&&!/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;(INTERVAL|COUNT|UNTIL|BYDAY|BYMONTHDAY|BYMONTH|BYSETPOS|WKST)=[A-Z0-9,+-]+)*$/.test(rrule))throw Error('Invalid RFC 5545 recurrence rule');
 const email=clean(b.organizerEmail,254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid organizer email');
 if(b.timezone&&b.timezone!=='America/Chicago')throw Error('Fayetteville events use America/Chicago');
 if(b.uncertainFields&&(!Array.isArray(b.uncertainFields)||b.uncertainFields.length>15||b.uncertainFields.some(f=>!['title','date','time','endTime','endDate','allDay','scheduleNote','sessions','civicNotice','locationUrl','venue','address','recurrence','organizerName','organizerUrl','organizerEmail','organizerPhone','description','source','price'].includes(f))))throw Error('Invalid uncertainty fields');
 if(b.civicNotice&&!['early-voting','election-day'].includes(b.civicNotice))throw Error('Invalid civic notice');
 return {civicNotice:b.civicNotice||'',locationUrl:https(clean(b.locationUrl,2000)),uncertainFields:b.uncertainFields||[],timezone:'America/Chicago',recurrence,rrule,organizerName:clean(b.organizerName),organizerUrl:https(clean(b.organizerUrl,2000)),organizerEmail:email,organizerPhone:clean(b.organizerPhone,60)};
}
// SQL statements are conditional on the committed revision. A concurrent decision cannot
// leave relationships/evidence belonging to a different version of the event.
export async function recordStatements(env,e,eventId,revision,research,runId,decisionId){
 const q=(s,...args)=>env.DB.prepare(s).bind(...args),out=[];
 const guard='EXISTS(SELECT 1 FROM events WHERE id=? AND revision=?)'+(decisionId?' AND EXISTS(SELECT 1 FROM moderation_decisions WHERE id=?)':''),g=[eventId,revision,...(decisionId?[decisionId]:[])];
 const city=/\bBentonville\b/i.test(e.address)?'Bentonville':/\bRogers\b/i.test(e.address)?'Rogers':'Fayetteville';
 const vk=[e.venue,e.address].map(v=>v.trim().toLowerCase()).join('|'),vid=await digest(vk);
 if(e.venue||e.address)out.push(q(`INSERT OR IGNORE INTO venues(id,identity_key,name,address,city) SELECT ?,?,?,?,? WHERE ${guard}`,vid,vk,e.venue,e.address,city,...g));
 let ok='',oid='';if(e.organizerName){ok=[e.organizerName,e.organizerUrl,e.organizerEmail,e.organizerPhone].map(v=>v.toLowerCase()).join('|');oid=await digest(ok);out.push(q(`INSERT OR IGNORE INTO organizers SELECT ?,?,?,?,?,? WHERE ${guard}`,oid,ok,e.organizerName,e.organizerUrl,e.organizerEmail,e.organizerPhone,...g));}
 out.push(q(`UPDATE events SET venue_id=(SELECT id FROM venues WHERE identity_key=?),organizer_id=?,timezone=?,recurrence=?,rrule=?,uncertain_fields=?,civic_notice=?,location_url=? WHERE id=? AND ${guard}`,e.venue||e.address?vk:null,oid||null,e.timezone,e.recurrence,e.rrule,JSON.stringify(e.uncertainFields),e.civicNotice,e.locationUrl,eventId,...g));
 out.push(q(`DELETE FROM event_categories WHERE event_id=? AND ${guard}`,eventId,...g));
 out.push(q(`INSERT INTO event_categories SELECT ?,? WHERE ${guard}`,eventId,e.category,...g));
 out.push(q(`INSERT INTO event_occurrences SELECT ?,?,?,?,?,?,? WHERE ${guard} ON CONFLICT(id) DO UPDATE SET start_date=excluded.start_date,start_time=excluded.start_time,end_date=excluded.end_date,end_time=excluded.end_time,timezone=excluded.timezone`,eventId,eventId,e.date||null,e.time||null,e.endDate||e.date||null,e.endTime||null,e.timezone,...g));
 out.push(q(`DELETE FROM event_sessions WHERE event_id=? AND ${guard}`,eventId,...g));
 if(e.sessions?.length)out.push(q(`INSERT INTO event_sessions SELECT ?,json_extract(value,'$.date'),json_extract(value,'$.startTime'),json_extract(value,'$.endTime') FROM json_each(?) WHERE ${guard}`,eventId,JSON.stringify(e.sessions),...g));
 if(!research)return out;
 const refs=new Map();
 for(const s of research.snapshots){const h=await digest(s.text),sid=await digest(s.url+'|'+h),sourceId=await digest(s.url);refs.set(s.url,sid);
 out.push(q(`INSERT OR IGNORE INTO sources SELECT ?,?,?,0,? WHERE ${guard} AND NOT EXISTS(SELECT 1 FROM sources WHERE url=?)`,sourceId,new URL(s.url).hostname,s.url,'Captured evidence; enable explicitly for routine crawling.',...g,s.url));
 out.push(q(`INSERT OR IGNORE INTO source_snapshots SELECT ?,(SELECT id FROM sources WHERE url=? LIMIT 1),?,?,?,?,? WHERE ${guard}`,sid,s.url,s.url,s.fetchedAt,h,s.text,s.status,...g));}
 for(const c of research.claims)out.push(q(`INSERT OR IGNORE INTO event_evidence SELECT ?,?,?,?,?,? WHERE ${guard}`,eventId,revision,c.field,refs.get(c.url),c.quote,c.method,...g));
 if(runId)for(const [i,s]of research.steps.entries())out.push(q(`INSERT INTO crawl_steps SELECT ?,?,?,?,?,?,?,?,? WHERE ${guard}`,uuid(),runId,eventId,i,s.stage,s.rule,s.outcome,s.detail,new Date().toISOString(),...g));
 return out;
}
export function validateResearch(r){
 if(r===undefined)return null;
 if(!r||!Array.isArray(r.snapshots)||r.snapshots.length>5||!Array.isArray(r.claims)||r.claims.length>30||!Array.isArray(r.steps)||r.steps.length>20)throw Error('Invalid evidence bundle');
 let total=0;
 for(const s of r.snapshots){s.url=https(s.url);if(!s.url||typeof s.text!=='string'||(total+=s.text.length)>22000||!['ok','blocked','error'].includes(s.status)||!/^\d{4}-\d\d-\d\dT/.test(s.fetchedAt)||!Number.isFinite(Date.parse(s.fetchedAt)))throw Error('Invalid source snapshot');}
 for(const c of r.claims){if(!['title','date','time','endTime','endDate','allDay','scheduleNote','sessions','civicNotice','locationUrl','venue','address','recurrence','organizerName','organizerUrl','organizerEmail','organizerPhone','description','price'].includes(c.field)||typeof c.quote!=='string'||!c.quote.trim()||c.quote.length>1200||!['structured','text','manual','inferred'].includes(c.method))throw Error('Invalid field evidence');const s=r.snapshots.find(s=>s.url===c.url&&s.status==='ok');if(!s||!s.text.includes(c.quote))throw Error('Evidence quote not found in captured source');}
 for(const s of r.steps)for(const [k,n]of [['stage',60],['rule',100],['outcome',60],['detail',1500]])if(typeof s[k]!=='string'||s[k].length>n)throw Error('Invalid crawl decision step');
 return r;
}
export {reviewIssues};
