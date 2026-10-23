import {lastEventDate} from './event-schedule.js';
export const curationVersion='community-priority/v1';
// Editorial routing, not a quality score or permission to publish. No political/viewpoint rules.
export function curateEvent(e,today){
 if(e.date&&lastEventDate(e)<today)return {lane:'expired',reason:'The final event date has passed.'};
 const title=String(e.title||'').replace(/^tentative:\s*/i,'');
 const civic=e.category==='civics'||!!e.civicNotice;
 if(civic){
  if(e.civicNotice||/\b(vot(?:e|ing)|election|public hearing|rezon(?:e|ing)|town hall|public forum|public comment|budget workshop|city council meeting|planning commission meeting)\b/i.test(title))return {lane:'civic',reason:'Public participation or a consequential civic decision.'};
  if(/\b(workshop|bike tour|walking tour|guided tour|festival|celebration|volunteer|cleanup|clean-up|open house|ribbon cutting)\b/i.test(title))return {lane:'shortlist',reason:'A public activity with a clear way to participate.'};
  if(/\b(board|committee|commission|council|agenda session|bid opening|task force|friends of YRCC|long range planning)\b/i.test(title))return {lane:'routine',reason:'Routine administration; retained outside the main shortlist.'};
  return {lane:'civic',reason:'Civic listing worth checking for public relevance.'};
 }
 return {lane:'shortlist',reason:'An outing, gathering or activity to review.'};
}
export function inCurationView(e,view,today){const lane=curateEvent(e,today).lane;return view==='all'||(view==='shortlist'?(lane==='shortlist'||lane==='civic'):view===lane);}
