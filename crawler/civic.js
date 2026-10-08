import {reviewIssues,evidenceQuality} from '../src/lib/review.js';
import {validateResearch} from '../server/records.js';
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
const time=s=>{const m=s.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);return m&&+m[1]>=1&&+m[1]<=12&&+m[2]<60?String(+m[1]%12+(m[3]==='PM'?12:0)).padStart(2,'0')+':'+m[2]:''};
// This adapter accepts the Fayetteville CivicPlus public-meeting detail layout only.
// Related-event navigation must never contribute facts to the selected event.
export function extractCivicMeeting({url,text,fetchedAt,from='2026-10-07',through='2026-12-31'}){
 const u=new URL(url);if(u.protocol!=='https:'||!['www.fayetteville-ar.gov','fayetteville-ar.gov'].includes(u.hostname)||!/^\/m\/calendar\/event\/detail\/\d+$/.test(u.pathname))throw Error('Unregistered civic detail source');
 if(typeof text!=='string'||text.length>150000)throw Error('Bounded page text required');
 const main=text.split('Related Events')[0],title=main.split('Public Meetings Calendar\n')[1]?.split('\n')[0]?.trim();
 if(!title||/\b(test integration|test event|cancelled|canceled)\b/i.test(title))return {event:null,reason:'missing, test, or cancelled title'};
 const row=main.match(/^(All Day|\d{1,2}:\d{2} [AP]M)(?: - ([^|\n]+))? \| (\w+), (\w+) (\d{1,2}), (\d{4})$/m);
 if(!row)return {event:null,reason:'No explicit dated meeting row'};
 const date=`${row[6]}-${String(months.indexOf(row[4])+1).padStart(2,'0')}-${row[5].padStart(2,'0')}`;
 if(!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return {event:null,reason:'Invalid date'};
 if(date<from||date>through)return {event:null,reason:'Outside requested window'};
 const address=main.split('\n').find(s=>/\bFayetteville AR 727\d\d\b/.test(s))||'';
 const description=main.split('Public Meetings Calendar\n')[1]?.split('\n').slice(1).join('\n').split('See More')[0]?.trim()||'';
 const locationText=description.replace(/Doors to the meeting room will open 30 minutes prior to the start of the meeting\.\s*/i,'').trim();
 const locationLine=locationText.split('\n').find(line=>/Jordan Annex|City Hall|Town Center|Conference Room|Public Library|Community Center|parking lot|Airport|Council Chambers/i.test(line))||'';
 const venue=locationLine.length<=200?locationLine:'';

 const tentative=/\bTentative\b/i.test(title),following=/Immediately Following/i.test(title);
 const e={title,date,time:row[1]==='All Day'?'':time(row[1]),endDate:'',endTime:row[2]?time(row[2].trim()):'',allDay:row[1]==='All Day',scheduleNote:following?'Begins after the preceding meeting; listed time is approximate.':row[2]?.trim()==='No set end time'?'No fixed end time is published.':'',venue,address,category:'civics',source:url,organizerName:'City of Fayetteville',organizerUrl:'https://www.fayetteville-ar.gov/',recurrence:'single',organizerType:'crawl',uncertainFields:[],price:'',description:description||`${title}. ${tentative?'This meeting is tentative; confirm the current agenda before attending. ':''}${following?'Start depends on the preceding meeting. ':''}${/Facilities Closed/.test(main)?'City facilities are closed for this holiday. ':''}See the official city notice for meeting details and any agenda or remote-attendance links.`,evidence:'Official city public-meeting detail. Agenda items and specific rezoning cases are not inferred from the meeting name.',status:'pending'};
 if(tentative)e.uncertainFields.push('date');if(following)e.uncertainFields.push('time');
 const weekday=new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long'});if(weekday!==row[3])e.uncertainFields.push('date');
 const claims=[{field:'title',quote:title},{field:'date',quote:row[0]},{field:e.allDay?'allDay':'time',quote:row[0]},{field:'recurrence',quote:row[0]}];
 if(address)claims.push({field:'address',quote:address});
 if(venue)claims.push({field:'venue',quote:locationLine});
 if(e.endTime)claims.push({field:'endTime',quote:row[0]});
 if(description)claims.push({field:'description',quote:description.slice(0,1200)});
 e.research=validateResearch({snapshots:[{url,text:main,fetchedAt,status:'ok'}],claims:claims.map(c=>({...c,url,method:'text'})),steps:[{stage:'extract',rule:'civicplus-detail/v2',outcome:'one-event',detail:'Read only the current detail section; ignore Related Events, opening-door offset and navigation. Exact year required.'},{stage:'validate',rule:'civic-uncertainty/v1',outcome:reviewIssues(e).length?'needs_review':'ready',detail:'Tentative dates and approximate start times require confirmation. No agenda case is invented; one meeting stays one event.'},{stage:'route',rule:'human-approval/v1',outcome:'pending',detail:'Compare every moderation status before inserting. No automatic publication.'}]});
 e.score=evidenceQuality(e,e.research.claims);return {event:e,issues:reviewIssues(e)};
}
