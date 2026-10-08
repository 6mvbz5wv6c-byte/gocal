import {extractEvent} from './extract.js';
import {extractCivicMeeting} from './civic.js';
import {reviewIssues,evidenceQuality} from '../src/lib/review.js';
import {validateResearch} from '../server/records.js';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const clock=(h,m,period)=>{const n=+h;if(n<1||n>12||+(m||0)>59)return '';return String(n%12+(/p/i.test(period)?12:0)).padStart(2,'0')+':'+(m||'00')};

// Event identity is established before text parsing. Never search whole-page time strings.
export function extractCapturedPage(capture,existing,{allowedCities=['Fayetteville','Bentonville','Rogers'],from='2000-01-01',through='2100-12-31'}={}){
 if(capture.status!=='ok')return {event:null,reason:'Source unavailable; preserve pending record and previous evidence'};
 if(/https:\/\/(www\.)?fayetteville-ar.gov\/m\/calendar\/event\/detail\/\d+$/.test(capture.url))return extractCivicMeeting({...capture,from,through});
 const host=new URL(capture.url).hostname;
 const result=extractEvent({document:capture.documents,expectedTitle:existing.title,url:capture.url,fetchedAt:capture.fetchedAt,category:existing.category,allowedCities});
 if(!result.event)return {...result,reason:'No unambiguous matching structured event; defer to a source-specific adapter'};
 const e=result.event,conflicts=[];
 const flag=(field,message)=>{if(!e.uncertainFields.includes(field))e.uncertainFields.push(field);conflicts.push({field,code:'conflict',message})};
 let main='',visibleRow='',visibleStart='',visibleEnd='',visibleMonth='',visibleDay='';
 if(host==='themomentary.org'){
  const lines=capture.text.split('\n'),heading=lines.findLastIndex(s=>norm(s)===norm(existing.title));
  if(heading>=0)main=lines.slice(heading).join('\n').split('\nFooter')[0];
  const m=main.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2}),\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?(?:\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*)?(AM|PM)\b[^\n]*/mi);
  if(m){visibleRow=m[0];visibleMonth=String(months.indexOf(m[1].toLowerCase())+1).padStart(2,'0');visibleDay=m[2].padStart(2,'0');visibleStart=clock(m[3],m[4],m[5]||m[8]);if(m[6])visibleEnd=clock(m[6],m[7],m[8]);}
  // Copy actual organizer prose, never a generated schedule summary or site opening hours.
  if(!e.description&&main){const prose=main.split('\n').filter(s=>s.length>90&&!/^(The Momentary will be closed|Please allow|By signing|Not a member|Reserve your|Tickets are)/i.test(s));e.description=prose.slice(0,3).join('\n\n').slice(0,3000);}
 }else if(host==='thenwatoday.com'){
  const lines=capture.text.split('\n'),heading=lines.findIndex(s=>norm(s)===norm(existing.title));
  if(heading>=0)main=lines.slice(heading).join('\n').split('\nDetails')[0];
  const m=main.match(/\nWhen\n(\w+), (\w+) (\d{1,2}) · (\d{1,2}):(\d{2}) (AM|PM)/);
  if(m){visibleRow=m[0].trim();visibleMonth=String(months.indexOf(m[2].slice(0,3).toLowerCase())+1).padStart(2,'0');visibleDay=m[3].padStart(2,'0');visibleStart=clock(m[4],m[5],m[6]);if(e.date&&new Date(e.date+'T12:00:00Z').getUTCDay()!==weekdays.indexOf(m[1].toLowerCase()))flag('date','Visible weekday disagrees with structured date');}
 }else{
  flag('source','Structured data extracted; visible schedule adapter is not registered for this source');
 }
 if(main){
  const snapshot=e.research.snapshots[0];snapshot.text+='\n\nVISIBLE EVENT DETAIL\n'+main.slice(0,12000);
  const claim=(field,quote)=>{if(quote&&quote.length<=1200&&snapshot.text.includes(quote))e.research.claims.push({field,url:capture.url,quote,method:'text'})};
  if(visibleRow){
   if(e.date.slice(5)!==visibleMonth+'-'+visibleDay)flag('date','Visible month/day disagrees with JSON-LD');
   if(e.time!==visibleStart)flag('time',`Visible start ${visibleStart} disagrees with JSON-LD ${e.time}`);
   if(visibleEnd&&e.endTime&&visibleEnd!==e.endTime)flag('endTime','Visible finish disagrees with JSON-LD');
   if(visibleEnd&&!e.endTime){e.endTime=visibleEnd;claim('endTime',visibleRow)}
   if(e.time===visibleStart)claim('time',visibleRow);
  }else flag('time','No isolated visible date/time row to corroborate metadata');
  if(e.description&&!e.research.claims.some(c=>c.field==='description')){const paragraph=e.description.split('\n\n')[0];claim('description',paragraph.slice(0,1200))}
  if(/\b(cancelled|canceled|postponed)\b/i.test(main.slice(0,1500)))flag('date','Visible detail mentions cancellation or postponement');
 }
 // Recurrence prose is a cross-check, never a license to invent future occurrences.
 const description=e.description||'';
 const recurrence=description.match(/\b(?:every|on|continue on)\s+(?:(\d)(?:st|nd|rd|th)(?:\s*&\s*(\d)(?:st|nd|rd|th))?\s+)?(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)s?\b/i);
 if(recurrence&&e.date){const date=new Date(e.date+'T12:00:00Z'),ordinal=Math.ceil(date.getUTCDate()/7);if(date.getUTCDay()!==weekdays.indexOf(recurrence[3].toLowerCase())||(recurrence[1]&&![+recurrence[1],+(recurrence[2]||0)].includes(ordinal)))flag('date','Described repeat weekday/ordinal disagrees with the listed date');}
 // Only explicit event ranges preceded by “from” are considered; happy-hour clauses excluded.
 const ranges=[...description.matchAll(/\bfrom\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–~]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/gi)].filter(m=>!(/happy hour/i.test(description.slice(Math.max(0,m.index-80),m.index))));
 if(ranges.length===1){const m=ranges[0],start=clock(m[1],m[2],m[3]||m[6]),end=clock(m[4],m[5],m[6]);if(e.time&&e.time!==start)flag('time','Event description start disagrees with metadata');if(e.endTime&&e.endTime!==end)flag('endTime','Event description end disagrees with metadata');}
 e.evidence=conflicts.length?conflicts.map(c=>c.message).join('; '):'Exact event identity; structured schedule cross-checked against isolated visible detail. Human approval required.';
 e.research.steps.push({stage:'cross-check',rule:'visible-vs-structured/v2',outcome:conflicts.length?'conflict':'corroborated',detail:e.evidence.slice(0,1500)});
 // D1 stores one claim per field/source snapshot; prefer the last corroborating quote.
 e.research.claims=[...new Map(e.research.claims.map(c=>[c.field+'|'+c.url,c])).values()];
 e.score=evidenceQuality(e,e.research.claims);e.research=validateResearch(e.research);
 return {event:e,issues:[...reviewIssues(e),...conflicts],complete:reviewIssues(e).length===0};
}
