// Stored last dates are inclusive. A timed midnight finish belongs to the prior day.
export function shiftDate(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function lastEventDate(e){const end=e.endDate||e.date;return !e.allDay&&e.endTime==='00:00'&&end>e.date?shiftDate(end,-1):end}
export function eventOnDate(e,date){return !!e.date&&e.date<=date&&lastEventDate(e)>=date}
export function eventInMonth(e,month,focusDate){return focusDate?eventOnDate(e,focusDate):!!e.date&&e.date<=month+'-31'&&lastEventDate(e)>=month+'-01'}
const clock=t=>{if(!/^\d\d:\d\d$/.test(t||''))return 'Time unconfirmed';const [h,m]=t.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''}${h>=12?'pm':'am'}`};
export function eventTimeLabel(e,date){if(e.allDay)return 'All day';if(date&&date>e.date)return date===e.endDate&&e.endTime?'Ends '+clock(e.endTime):'Continues · see schedule';return clock(e.time)}
export function eventDateLabel(e){const label=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});return label(e.date)+(e.endDate&&e.endDate!==e.date?' – '+label(e.endDate):'')}
export function eventCalendarFile(e,stamp=new Date()){
 const clean=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r/g,'').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const compact=d=>d.replaceAll('-',''),timed=(d,t)=>compact(d)+'T'+t.replace(':','')+'00';
 // A date-span export preserves an unknown final time without inventing midnight.
 const dateSpan=e.allDay||(e.endDate>e.date&&!e.endTime);
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FindOut!//Community Calendar//EN','CALSCALE:GREGORIAN'];
 if(!dateSpan)lines.push('BEGIN:VTIMEZONE','TZID:America/Chicago','BEGIN:DAYLIGHT','DTSTART:20070311T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU','TZOFFSETFROM:-0600','TZOFFSETTO:-0500','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:20071104T020000','RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU','TZOFFSETFROM:-0500','TZOFFSETTO:-0600','END:STANDARD','END:VTIMEZONE');
 lines.push('BEGIN:VEVENT',`UID:${clean(e.id)}@findout.events`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').split('.')[0]}Z`);
 if(dateSpan)lines.push('DTSTART;VALUE=DATE:'+compact(e.date),'DTEND;VALUE=DATE:'+compact(shiftDate(e.endDate||e.date,1)));
 else {lines.push('DTSTART;TZID=America/Chicago:'+timed(e.date,e.time));if(e.endTime)lines.push('DTEND;TZID=America/Chicago:'+timed(e.endDate||e.date,e.endTime));}
 const schedule=eventDateLabel(e)+'; '+eventTimeLabel(e)+(e.endTime?' — ends '+clock(e.endTime)+' on '+(e.endDate||e.date):'')+(e.allDay?'':' Central Time.');
 lines.push('TRANSP:TRANSPARENT',`SUMMARY:${clean(e.title)}`,`LOCATION:${clean(e.venue+' '+(e.address||''))}`,`DESCRIPTION:${clean([e.description,schedule,e.scheduleNote].filter(Boolean).join('\n'))}`,'END:VEVENT','END:VCALENDAR');
 // RFC 5545 folds at 75 UTF-8 octets, without splitting Unicode characters.
 const fold=line=>{let out='',size=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(size+n>75){out+='\r\n ';size=1}out+=ch;size+=n}return out};
 return lines.map(fold).join('\r\n')+'\r\n';
}
