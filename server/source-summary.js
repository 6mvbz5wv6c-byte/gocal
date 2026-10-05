// Summarize only the selected record. Raw pages may contain neighboring shows.
export function buildSourceSummary(e,snapshots=[]){
 const parts=[];
 if(e.title)parts.push(e.title+'.');
 if(e.date){const d=new Date(e.date+'T12:00:00Z');if(Number.isFinite(+d))parts.push(d.toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'})+(e.uncertainFields?.includes('date')?' (date needs confirmation)':'')+'.');}
 const clock=t=>{if(!/^\d{2}:\d{2}$/.test(t||''))return '';const [h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`};
 if(e.time)parts.push(`Starts ${clock(e.time)}${e.endTime?' · ends '+clock(e.endTime)+(e.endDate&&e.endDate!==e.date?' on '+e.endDate:''):''} Central Time.`);
 if(e.venue)parts.push(e.venue+(e.address?' — '+e.address:'')+'.');
 // Doors may only be used when the exact title begins an isolated listing and
 // a purchase boundary terminates it before another show's text.
 for(const s of snapshots){const raw=s.text||s.content_text||'';const lines=raw.split(/\r?\n/);const i=lines.findIndex(x=>x.trim().toLowerCase()===e.title?.trim().toLowerCase());if(i<0)continue;const rest=lines.slice(i+1),end=rest.findIndex(x=>/^purchase(?: tickets)?$/i.test(x.trim()));if(end<0)continue;const segment=rest.slice(0,end).join(' ');const match=segment.match(/\bDOORS\s+(\d{1,2}:\d{2}\s*[AP]M)\b/i);if(match){parts.push('Doors '+match[1].toUpperCase().replace(/\s*([AP]M)$/,' $1')+'.');break;}}
 return parts.join(' ').slice(0,1400);
}
