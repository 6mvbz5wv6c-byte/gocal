'use client';
import {useEffect,useState,FormEvent} from 'react';
import {Check,ShieldCheck,Search,ExternalLink,Loader2,RefreshCw,Share2,Flag,Download,MapPin,Clock,CalendarDays,Sparkles,LockKeyhole} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';
import {categories,CalEvent,timeLabel} from '@/lib/events';
export type Session={user:{id:string;name:string;email:string;role:string}|null;adminConfigured:boolean;aiConfigured:boolean};
export async function api<T=Record<string,unknown>>(path:string):Promise<T>{
 if(path==='session')return {user:null,adminConfigured:false,aiConfigured:false} as T;
 if(path!=='events')throw new Error('This static edition has no submission backend.');
 const res=await fetch(new URL('./events.json',document.baseURI),{cache:'no-store'});
 if(!res.ok)throw new Error('The published event file could not be loaded.');
 const data=await res.json();
 if(!data||!Array.isArray(data.events))throw new Error('The published event file is invalid.');
 return data as T;
}
function Choice({name,value,onChange,items}:{name:string;value:string;onChange:(v:string)=>void;items:{value:string;label:string}[]}){return <Select name={name} value={value} onValueChange={onChange}><SelectTrigger className="form-select"><SelectValue/></SelectTrigger><SelectContent>{items.map(i=><SelectItem value={i.value} key={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>}
export function Submission({session,onDone}:{session:Session|null;onDone:()=>void}){
 return <div className="event-detail"><div className="notice">Community submissions are not open on this GitHub Pages edition yet.</div><p>Browsing the calendar is public and needs no login. A secure submission service will be connected before we start accepting events.</p><p>No event information is collected or saved here.</p><button className="primary" onClick={onDone}>Back to the calendar</button></div>;
}
export function EventDetails({event,session}:{event:CalEvent;session:Session|null}){
 const [report,setReport]=useState(false),[reason,setReason]=useState('incorrect'),[busy,setBusy]=useState(false);const c=categories.find(c=>c.id===event.category)!;
 async function share(){const url=new URL('./',document.baseURI);url.searchParams.set('event',event.id);try{if(navigator.share)await navigator.share({title:event.title,url:url.href});else {await navigator.clipboard.writeText(url.href);toast.success('Event link copied.');}}catch(e){if((e as Error).name!=='AbortError')toast.error('Could not share. Copy the address from your browser.');}}
 function download(){const clean=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\r/g,'');const start=event.date.replaceAll('-','')+'T'+event.time.replace(':','')+'00';const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FindOut!//Community Calendar//EN','BEGIN:VEVENT',`UID:${event.id}@findout.events`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART;TZID=America/Chicago:${start}`,`SUMMARY:${clean(event.title)}`,`LOCATION:${clean(event.venue+' '+(event.address||''))}`,`DESCRIPTION:${clean(event.description)}`,'END:VEVENT','END:VCALENDAR'];const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='findout-event.ics';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}

 return <div className="event-detail"><span className="category-tag" style={{background:c.bg,color:c.color}}>{c.name}</span>{event.sample&&<div className="notice">This is an illustrative event, not a real listing. Please don’t travel to it.</div>}<p className="event-description">{event.description}</p><div className="detail-info"><CalendarDays/><span>{new Date(event.date+'T12:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span></div><div className="detail-info"><Clock/><span>{timeLabel(event.time)} · Central Time</span></div><div className="detail-info"><MapPin/><span>{event.venue}<small>{event.address||'Address unconfirmed'}</small></span></div><div className="detail-cost">{event.price}<small>Check with the organizer for availability.</small></div><div className="detail-actions"><button className="primary" onClick={share}><Share2 size={16}/>Share event</button><button className="secondary" disabled={event.sample} onClick={download}><Download size={16}/>Add to calendar</button></div>{event.source&&<a className="source-link" href={event.source} target="_blank" rel="noopener noreferrer">View original source <ExternalLink size={14}/></a>}<p className="form-help">Reporting is not connected on this static preview. Confirm details with the original organizer.</p></div>
}
export function Moderator({session,onChanged}:{session:Session|null;onChanged:()=>void}){
 return <div className="event-detail"><p>This is the public GitHub Pages edition of FindOut!. You can browse, search, filter, and share events without signing in.</p><div className="notice">Sample events are illustrative, not real listings. The live calendar reads an owner-maintained event file.</div><p>Submissions, event reports, moderator accounts, and automated discovery require a separate backend. They are not running on this static site.</p></div>;
}
