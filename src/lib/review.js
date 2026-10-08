import {sessionIssues,civicIssues,officialVotingUrl} from './civic-schedule.js';
// Shared deterministic quality gate. Missing data stays null/empty, never a fake date.
export const fieldLabels={title:'Title',date:'Date',time:'Start time',endTime:'End time',endDate:'End date',venue:'Location',address:'Address',recurrence:'Recurrence',organizerName:'Organizer',organizerUrl:'Organizer contact',description:'Description',source:'Source',sessions:'Daily opening hours',civicNotice:'Voting notice',locationUrl:'Vote-center lookup'};
export function isOvernightOccurrence(e){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')||!/^\d{4}-\d{2}-\d{2}$/.test(e.endDate||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.endTime||''))return false;
 const start=Date.parse(e.date+'T'+e.time+':00Z'),end=Date.parse(e.endDate+'T'+e.endTime+':00Z');
 return e.endDate>e.date&&end>start&&end-start<86400000;
}
const present=value=>typeof value==='string'&&!!value.trim()&&!/^(UNABLE TO DETERMINE|unknown|tbd|tba)$/i.test(value.trim());
const optionalFields=['endTime','venue','address','organizerName','organizerUrl','organizerEmail','organizerPhone','description','recurrence'];
export function reviewIssues(e){
 const issues=[];const add=(field,code,message)=>issues.push({field,code,message});
 for(const field of ['title','date',...(e.allDay?[]:['time']),'source'])if(!present(e[field]))add(field,'missing','UNABLE TO DETERMINE — required before publishing');
 if(e.civicNotice){
  if(!present(e.venue)&&!officialVotingUrl(e.locationUrl))add('venue','missing','Voting needs a location or official vote-center lookup');
  if(!present(e.address)&&!(e.civicNotice==='election-day'&&officialVotingUrl(e.locationUrl)))add('address','missing','Voting needs an address; Election Day can use the official lookup');
 }
 if(e.endDate&&e.endDate<e.date)add('endDate','order','End date must be on or after start date');
 if(e.recurrence==='range'&&!e.endDate)add('endDate','missing','Multi-day event needs an end date');
 if(e.allDay&&(e.time||e.endTime))add('time','conflict','All-day events must not have clock times');
 if(e.time&&e.endTime&&(!e.endDate||e.endDate===e.date)&&e.endTime<=e.time)add('endTime','order','End must follow start; confirm the end date for overnight events');
 if(e.recurrence==='rule'&&!e.rrule)add('recurrence','missing','Recurring event needs an RRULE');
 // An absent optional field is not a conflict. A supplied but uncertain fact is.
 const relevant=field=>!optionalFields.includes(field)||present(e[field]);
 for(const field of e.uncertainFields||[])if(relevant(field))add(field,'uncertain',field==='date'&&/\btentative\b/i.test(e.title)?'Source labels this meeting tentative — verify before publishing':field==='time'&&/immediately following/i.test(e.title)?'Starts after another meeting — verify the listed time':'Source is ambiguous or inferred: confirm before approval');
 for(const c of e.claims||[])if(c.method==='inferred'&&relevant(c.field))add(c.field,'inferred','Inferred from source: confirm before approval');
 const all=[...issues,...sessionIssues(e),...civicIssues(e)];
 return all.filter((i,n)=>all.findIndex(j=>j.field===i.field&&j.code===i.code)===n);
}
export function reviewWarnings(e){
 const warnings=[];const add=(field,message)=>warnings.push({field,code:'optional',message});
 if(!present(e.venue)&&!present(e.address)&&!e.locationUrl)add('venue','Location not listed — optional for citywide or location-independent events');
 else if(!present(e.address)&&!e.locationUrl)add('address','Street address not listed — a named venue or area is enough');
 if(!present(e.organizerName))add('organizerName','Organizer not listed');
 if(!e.organizerUrl&&!e.organizerEmail&&!e.organizerPhone)add('organizerUrl','Organizer contact not listed');
 if(!present(e.description))add('description','Organizer description not available');
 if(!e.recurrence||e.recurrence==='unknown')add('recurrence','Repeat schedule unknown — only this dated occurrence will appear');
 return warnings.filter(i=>!reviewIssues(e).some(b=>b.field===i.field));
}
export const evidenceScoreVersion='applicable-fields/v2';
export function evidenceQuality(e,claims=[]){
 // Coverage, not a probability: omitted optional fields cannot earn or lose points.
 const fields=['title','date',e.allDay?'allDay':'time',...['endTime','endDate','venue','address','organizerName','recurrence'].filter(f=>present(e[f]))];
 return Math.round(100*fields.filter(f=>e[f]&&!e.uncertainFields?.includes(f)&&claims.some(c=>c.field===f&&c.method!=='inferred')).length/fields.length);
}
