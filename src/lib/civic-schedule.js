// Voting notices are jurisdiction-specific. Other regions must register their authority.
export function officialVotingUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['www.washingtoncountyar.gov','washingtoncountyar.gov','www.sos.arkansas.gov','sos.arkansas.gov','www.voterview.ar-nova.org','www.voterview.org','voterview.org'].includes(u.hostname)}catch{return false}}
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const validTime=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function sessionIssues(e){
 const issues=[];const add=message=>issues.push({field:'sessions',code:'schedule',message});
 if((e.sessions!==undefined&&!Array.isArray(e.sessions))||(e.sessions||[]).length>366){add('Use at most 366 dated opening periods');return issues}
 const seen=new Set();for(const s of e.sessions||[]){if(!s||!validDate(s.date)||!validTime(s.startTime)||!validTime(s.endTime)||s.endTime<=s.startTime){add('Each opening period needs a real date and increasing start/end times');continue}if(s.date<e.date||s.date>(e.endDate||e.date))add('Opening dates must be within the event date range');if(seen.has(s.date))add('Only one opening period per date is supported');seen.add(s.date)}
 if(issues.length)return issues;
 if(e.sessions?.length){const sorted=[...e.sessions].sort((a,b)=>a.date?.localeCompare(b.date));if(e.allDay)add('Dated opening periods cannot be all day');if(sorted[0].date!==e.date||sorted[0].startTime!==e.time||sorted.at(-1).date!==(e.endDate||e.date)||sorted.at(-1).endTime!==e.endTime)add('Event range must match the first opening and last closing')}
 return issues;
}
export function civicIssues(e){const issues=[];if(!e.civicNotice)return issues;const add=(field,message)=>issues.push({field,code:'civic',message});if(!['early-voting','election-day'].includes(e.civicNotice)||e.category!=='civics')add('civicNotice','Voting ribbons require a Civics voting notice');if(!officialVotingUrl(e.source))add('source','Voting notices require a registered official election authority');if(!e.sessions?.length)add('sessions','Voting notices need explicit dates and opening/closing hours');if(e.civicNotice==='election-day'&&e.endDate&&e.endDate!==e.date)add('endDate','Election Day must be a single date');if(e.locationUrl&&!officialVotingUrl(e.locationUrl))add('locationUrl','Use the official authority for vote-center lookup');return issues}
export function centralClock(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`}}
export function civicStatus(e,now=new Date()){
 const {date,time}=centralClock(now),s=e.sessions?.find(s=>s.date===date);
 if(date<e.date)return 'Upcoming';if(date>(e.endDate||e.date))return 'Voting ended';if(!s)return 'No voting today';if(time<s.startTime)return 'Opens '+s.startTime+' today';if(time>=s.endTime)return 'Closed for today';return 'POLLS OPEN';
}
