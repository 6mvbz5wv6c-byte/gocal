// Shared deterministic quality gate. Missing data stays null/empty, never a fake date.
export const fieldLabels={title:'Title',date:'Date',time:'Start time',endTime:'End time',endDate:'End date',venue:'Location',address:'Address',recurrence:'Recurrence',organizerName:'Organizer',organizerUrl:'Organizer contact',description:'Description',source:'Source'};
export function reviewIssues(e){
 const issues=[];const add=(field,code,message)=>issues.push({field,code,message});
 for(const field of ['title','date','time','venue','address','description','source','organizerName'])if(!e[field]?.trim()||e[field]==='UNABLE TO DETERMINE')add(field,'missing','UNABLE TO DETERMINE');
 if(!e.organizerUrl&&!e.organizerEmail&&!e.organizerPhone)add('organizerUrl','missing','UNABLE TO DETERMINE');
 if(!e.recurrence||e.recurrence==='unknown')add('recurrence','missing','UNABLE TO DETERMINE');
 if(e.endDate&&e.endDate!==e.date)add('endDate','series','Date range: split into individual scheduled occurrences before approval');
 if(e.time&&e.endTime&&(!e.endDate||e.endDate===e.date)&&e.endTime<=e.time)add('endTime','order','End must follow start; confirm the end date for overnight events');
 if(e.recurrence==='rule'&&!e.rrule)add('recurrence','missing','Recurring event needs an RRULE');
 for(const field of e.uncertainFields||[])if(field!=='endTime'||e.endTime)add(field,'uncertain','Source is ambiguous or inferred: confirm before approval');
 for(const c of e.claims||[])if(c.method==='inferred'&&(c.field!=='endTime'||e.endTime))add(c.field,'inferred','Inferred from source: confirm before approval');
 return issues;
}
export function evidenceQuality(e,claims=[]){
 const fields=['title','date','time','endTime','venue','address','recurrence','organizerName'];
 return Math.round(100*fields.filter(f=>e[f]&&claims.some(c=>c.field===f&&c.method!=='inferred')).length/fields.length);
}
