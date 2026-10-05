import {reviewIssues,evidenceQuality,isOvernightOccurrence} from '../src/lib/review.js';
import {validateResearch} from '../server/records.js';
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const plain=s=>typeof s==='string'?s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,'').trim():'';
const dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function localParts(s){
 if(typeof s!=='string')return {date:'',time:''};
 const match=s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ]([0-2]\d:[0-5]\d)(?::[0-5]\d)?(Z|[+-]\d\d:\d\d)?)?$/);
 if(!match||!dateOK(match[1])||(match[2]&&match[2]>'23:59'))return {date:'',time:''};
 if(match[3]){const d=new Date(s.replace(' ','T'));if(!Number.isFinite(d.getTime()))return {date:'',time:''};const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
 return {date:match[1],time:match[2]||''};
}
function nodes(v){if(Array.isArray(v))return v.flatMap(nodes);if(!v||typeof v!=='object')return [];return [v,...nodes(v['@graph'])];}
function safeURL(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
// Deterministic extraction boundary. A local LLM may propose additional fields with exact
// quotes, but cannot change review status or bypass the same quality gate.
export function extractEvent({document,expectedTitle,url,fetchedAt=new Date().toISOString(),category='community',allowedCities=['Fayetteville']}){
 if(!safeURL(url))throw Error('HTTPS source required');
 const list=nodes(document).filter(v=>[v['@type']].flat().some(t=>/^(https?:\/\/schema.org\/)?(Event|MusicEvent|TheaterEvent|EducationEvent|SocialEvent|ExhibitionEvent)$/.test(t)));
 const matches=list.filter(v=>normalize(v.name)===normalize(expectedTitle));
 if(matches.length!==1)return {event:null,issues:[{field:'title',code:matches.length?'ambiguous':'not_found',message:'Select one exact event; page-wide dates must not be mixed.'}],steps:[{stage:'identify',rule:'exact-event-identity/v1',outcome:'needs_review',detail:`Found ${matches.length} exact matches.`}]};
 const v=matches[0],start=localParts(v.startDate),end=localParts(v.endDate),loc=Array.isArray(v.location)?v.location[0]:v.location||{},addr=loc.address||{},org=Array.isArray(v.organizer)?v.organizer[0]:v.organizer||{};
 const address=typeof addr==='string'?plain(addr):[addr.streetAddress,addr.addressLocality,addr.addressRegion,addr.postalCode].map(plain).filter(Boolean).join(', ');
 const e={title:plain(v.name),date:start.date,time:start.time,endDate:end.date||'',endTime:end.time,timezone:'America/Chicago',venue:plain(loc.name),address,category,description:plain(v.description),source:safeURL(url),organizerName:plain(org.name),organizerUrl:safeURL(org.url),organizerEmail:plain(org.email),organizerPhone:plain(org.telephone),recurrence:end.date&&end.date!==start.date?'range':start.date?'single':'unknown',rrule:'',organizerType:'crawl',status:'pending',uncertainFields:[],price:'Check organizer',evidence:''};
 if(e.date===e.endDate&&e.time===e.endTime)e.endTime=''; // Common calendar placeholder, not a real duration.
 if(isOvernightOccurrence(e))e.recurrence='single';
 if(typeof addr==='object'&&addr.addressLocality&&!allowedCities.map(normalize).includes(normalize(addr.addressLocality)))e.uncertainFields.push('address');
 if(typeof addr==='object'&&addr.addressRegion&&!['ar','arkansas'].includes(normalize(addr.addressRegion)))e.uncertainFields.push('address');
 if(/\b(cancelled|canceled|postponed)\b/i.test(e.title)||/Cancelled|Canceled|Postponed/i.test(v.eventStatus||''))e.uncertainFields.push('date');
 const text=JSON.stringify(v,null,2),claims=[];
 const proof={title:v.name,date:v.startDate,time:start.time?v.startDate:null,endDate:v.endDate,endTime:e.endTime?v.endDate:null,venue:loc.name,address:loc.address,organizerName:org.name,organizerUrl:org.url,organizerEmail:org.email,organizerPhone:org.telephone,description:v.description,recurrence:v.startDate};
 for(const [field,value]of Object.entries(proof)){if(!e[field]||!value)continue;const quote=typeof value==='object'?JSON.stringify(value.streetAddress||value.addressLocality||''):JSON.stringify(value);if(quote&&text.includes(quote))claims.push({field,url,quote,method:'structured'});}
 const issues=reviewIssues(e);for(const field of ['title','date','time','endTime','venue','address','organizerName','recurrence'])if(e[field]&&!claims.some(c=>c.field===field))issues.push({field,code:'unsupported',message:'UNABLE TO DETERMINE — missing supporting quote'});
 const steps=[{stage:'identify',rule:'exact-event-identity/v1',outcome:'matched',detail:'Selected one Event object by exact normalized title; sibling event dates ignored.'},{stage:'normalize',rule:'local-calendar/v1',outcome:'normalized',detail:'ISO dates, 24-hour times, America/Chicago timezone; doors/opening hours are not start times.'},{stage:'validate',rule:'required-fields/v1',outcome:issues.length?'needs_review':'complete',detail:issues.length?issues.map(i=>`${i.field}: ${i.message}`).join('; '):'All required fields have source evidence.'},{stage:'route',rule:'human-approval/v1',outcome:'pending',detail:'Ready or incomplete, only a human reviewer can publish.'}];
 e.score=evidenceQuality(e,claims);e.research=validateResearch({snapshots:[{url,text,fetchedAt,status:'ok'}],claims,steps});return {event:e,issues,steps,complete:issues.length===0};
}
