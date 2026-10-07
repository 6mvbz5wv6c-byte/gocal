import {useEffect,useState} from 'react';
import {Vote,ArrowUpRight} from 'lucide-react';
import {civicStatus} from '@/lib/civic-schedule';
import {eventDateLabel} from '@/lib/event-schedule';
import {CalEvent} from '@/lib/events';
export function CivicRibbons({events,month,onSelect}:{events:CalEvent[];month:string;onSelect:(e:CalEvent)=>void}){
 const [now,setNow]=useState(new Date());useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer)},[]);
 const notices=events.filter(e=>e.civicNotice&&e.date<=month+'-31'&&(e.endDate||e.date)>=month+'-01');
 if(!notices.length)return null;
 return <div className="civic-ribbons" aria-label="Voting dates and hours">{notices.map(e=><button key={e.id} className="civic-ribbon" onClick={()=>onSelect(e)}><Vote size={21} aria-hidden="true"/><span><strong>{e.civicNotice==='early-voting'?'EARLY VOTING':'ELECTION DAY'} — {civicStatus(e,now)}</strong><small>{eventDateLabel(e)} · {e.civicNotice==='early-voting'?e.venue:'Check your vote center'} · View details</small></span><ArrowUpRight size={18} aria-hidden="true"/></button>)}</div>
}
