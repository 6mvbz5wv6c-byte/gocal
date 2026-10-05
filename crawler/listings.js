import {reviewIssues,evidenceQuality} from '../src/lib/review.js';
import {validateResearch} from '../server/records.js';

const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const weekdays=['sun','mon','tue','wed','thu','fri','sat'];
const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const clock=s=>{const m=s.match(/^(\d{1,2})(?::([0-5]\d))?\s*([ap])m$/i);return m&&+m[1]>=1&&+m[1]<=12?`${String(+m[1]%12+(m[3].toLowerCase()==='p'?12:0)).padStart(2,'0')}:${m[2]||'00'}`:'';};
function https(url){const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)throw Error('HTTPS source required');return u.href;}

// A venue-specific fallback for captured listing text. Prefer DOM cards / JSON-LD
// when available. Never let a date search span two purchase-delimited cards.
export function extractListings({text,url,fetchedAt=new Date().toISOString(),yearContext,venueContext,category='music',allowedCities=['Fayetteville']}){
 url=https(url);
 if(typeof text!=='string'||text.length>18000)throw Error('Capture a listing section of at most 18,000 characters');
 const snapshots=[{url,text,fetchedAt,status:'ok'}];
 function context(c){
  if(!c)return;
  const source=https(c.url);
  if(typeof c.text!=='string'||c.text.length>2000)throw Error('Context requires a bounded source capture');
  const same=snapshots.find(s=>s.url===source);
  if(same)same.text+='\n'+c.text;else snapshots.push({url:source,text:c.text,fetchedAt,status:'ok'});
 }
 context(yearContext);context(venueContext);
 if(yearContext&&(!Number.isInteger(yearContext.year)||yearContext.year<2000||yearContext.year>2100||typeof yearContext.quote!=='string'||!yearContext.text.includes(yearContext.quote)||!new RegExp(`\\b${yearContext.year}\\b`).test(yearContext.quote)))throw Error('Year requires an exact supporting source quote');
 const results=[],issues=[],seen=new Set();
 const blocks=text.split(/\bPURCHASE(?:\s+TICKETS)?\b/gi).map(s=>s.trim()).filter(Boolean);
 for(const [index,block] of blocks.entries()){
  const reject=message=>issues.push({block:index,field:'title',code:'boundary',message});
  // Requiring a weekday and AM/PM makes these anchors much less likely to be
  // numbers in a band name. Different layouts need their own tested adapter.
  const anchors=[...block.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\s+(\d{1,2}(?::\d{2})?\s*[AP]M)\s*\((Sun|Mon|Tue|Wed|Thu|Fri|Sat)\)/gi)];
  if(anchors.length!==1){reject(`Expected one dated show in this block; found ${anchors.length}. Re-fetch individual event cards/detail pages.`);continue;}
  const a=anchors[0],title=block.slice(0,a.index).trim();
  if(!title||title.length>200||/\bDOORS\b/i.test(title)){reject('Missing or ambiguous title boundary.');continue;}
  const ownIssues=[],uncertainFields=[];
  const flag=(field,code,message)=>{ownIssues.push({field,code,message});if(!uncertainFields.includes(field))uncertainFields.push(field);};
  const year=a[3]?+a[3]:yearContext?.year;
  let date='';
  if(year){
   const candidate=`${year}-${String(months.indexOf(a[1].slice(0,3).toLowerCase())+1).padStart(2,'0')}-${a[2].padStart(2,'0')}`;
   const parsed=new Date(candidate+'T12:00:00Z');
   if(Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===candidate){date=candidate;if(weekdays[parsed.getUTCDay()]!==a[5].toLowerCase())flag('date','weekday','Printed weekday disagrees with the year/date.');}
   else flag('date','invalid','Invalid calendar date.');
   if(a[3]&&yearContext&&+a[3]!==yearContext.year)flag('date','year_conflict','Event year disagrees with page context.');
  }else flag('date','missing_year','UNABLE TO DETERMINE — year is absent; do not use the machine clock.');
  const time=clock(a[4]);if(!time)flag('time','invalid','UNABLE TO DETERMINE — invalid start time.');
  let tail=block.slice(a.index+a[0].length).trim(),doors='';
  const dm=tail.match(/^DOORS\s+(\d{1,2}(?::\d{2})?\s*[AP]M)\b/i);
  if(dm){doors=clock(dm[1]);tail=tail.slice(dm[0].length).trim();if(!doors)flag('description','doors','Invalid doors time; verify on the event page.');}
  // Without verified venue context, this suffix is only a proposed venue. A
  // truncated capture must not silently acquire a neighboring event's venue.
  const venue=tail.length<=200?tail:'';
  const contextMatches=venueContext&&typeof venueContext.venue==='string'&&normalized(venue)===normalized(venueContext.venue)&&venueContext.text.includes(venueContext.venue);
  if(!contextMatches)flag('venue','unverified','Venue suffix needs verification against the venue page (capture may be truncated).');
  const e={title,date,time,endTime:'',endDate:'',timezone:'America/Chicago',venue,address:'',organizerName:'',organizerUrl:'',organizerEmail:'',organizerPhone:'',recurrence:'single',rrule:'',category,source:url,price:'Check organizer',organizerType:'crawl',status:'pending',uncertainFields};
  const claims=[{field:'title',url,quote:title,method:'text'},{field:'recurrence',url,quote:a[0],method:'text'}];
  if(time)claims.push({field:'time',url,quote:a[0],method:'text'});
  if(venue)claims.push({field:'venue',url,quote:venue,method:'text'});
  if(date){claims.push({field:'date',url,quote:a[0],method:'text'});if(!a[3])claims.push({field:'date',url:https(yearContext.url),quote:yearContext.quote,method:'text'});}
  if(contextMatches)for(const field of ['address','organizerName','organizerUrl']){
   const value=venueContext[field];
   if(typeof value==='string'&&value.length<=2000&&value&&venueContext.text.includes(value)){
    e[field]=field==='organizerUrl'?https(value):value;
    claims.push({field,url:https(venueContext.url),quote:value,method:'text'});
   }
  }
  if(e.address){const address=normalized(e.address).replace(/[^\p{L}\p{N}]+/gu,' ');if(!allowedCities.some(city=>['ar','arkansas'].some(state=>(' '+address+' ').includes(' '+normalized(city)+' '+state+' '))))flag('address','scope','Address is outside the configured Arkansas city scope or needs geographic verification.');}
  if(/\b(cancelled|canceled|postponed)\b/i.test(title))flag('date','cancelled','Cancellation/postponement needs human review.');
  e.description=`${title}. ${a[0]}.${dm?' '+dm[0]+'.':''}${venue?' '+venue+'.':''}`;
  e.sourceSummary=e.description;
  e.evidence='One purchase-delimited listing; field quotes are restricted to this event and verified venue/year context.';
  const steps=[{stage:'segment',rule:'purchase-listings/v1',outcome:'isolated',detail:`Listing ${index+1}; exactly one dated show; start ${time||'unknown'}, doors ${doors||'unknown'}; no end time inferred.`},{stage:'validate',rule:'listing-context/v1',outcome:'checked',detail:ownIssues.map(i=>i.message).join('; ')||'Year/weekday and venue context agree.'},{stage:'route',rule:'human-approval/v1',outcome:'pending',detail:'No automatic publication. Missing fields require detail-page enrichment or a reviewer.'}];
  const key=JSON.stringify([title,date,a[0],time,venue,doors]);
  if(seen.has(key))continue;seen.add(key);
  e.research=validateResearch({snapshots:structuredClone(snapshots),claims,steps});
  e.score=evidenceQuality(e,claims);
  const problems=[...ownIssues,...reviewIssues(e)];
  results.push({event:e,doorsTime:doors,issues:problems,complete:problems.length===0});
 }
 return {events:results.map(r=>r.event),results,issues};
}
