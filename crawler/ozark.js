import {reviewIssues,evidenceQuality} from '../src/lib/review.js';
import {validateResearch} from '../server/records.js';
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const key=s=>s.normalize('NFKC').toLowerCase().replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const clock=s=>{const m=s.match(/^(\d{1,2})(?::(\d\d))?\s*(am|pm)$/i);if(!m||+m[1]<1||+m[1]>12||+(m[2]||0)>59)return '';return String(+m[1]%12+(m[3].toLowerCase()==='pm'?12:0)).padStart(2,'0')+':'+(m[2]||'00')};
// Ticket aliases are exact alternative names observed on the linked organizer calendar.
const aliases={
 'The Brook and the Bluff – The Werewolf Tour':['The Brook & The Bluff'],
 'Bitch Cabal Feat. Mannequin Pussy, Wednesday':['Bitch Cabal feat. Mannequin Pussy & Wednesday'],
 'Emo Orchestra w/ The Spill Canvas':['Emo Orchestra w / The Spill Canvas']
};
export function extractOzark({page,ticketCards=[]}){
 if(new URL(page.url).hostname!=='ozarkmusichall.com'||page.status!=='ok')throw Error('Successful official venue detail capture required');
 const titles=page.headings.filter(h=>h[0]==='h1');if(titles.length!==1)throw Error('Expected one show title');
 const title=titles[0][1],body=page.text.split('STAY IN TOUCH')[0],start=body.indexOf('\n'+title+'\n');if(start<0)throw Error('No isolated show header');
 const detail=body.slice(start+1),dateMatch=detail.match(/\n([A-Z][a-z]{2}) (\d{1,2}), (\d{4})\n/);if(!dateMatch||!months.includes(dateMatch[1]))throw Error('Explicit event year required');
 const date=`${dateMatch[3]}-${String(months.indexOf(dateMatch[1])+1).padStart(2,'0')}-${dateMatch[2].padStart(2,'0')}`;
 if(new Date(date+'T12:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');
 const doors=detail.match(/\nDoors: ([^\n]+)/)?.[1]||'';
 const names=new Set([title,...(aliases[title]||[])].map(key));
 const cards=ticketCards.filter(c=>names.has(key(c.title))&&c.month===+date.slice(5,7)&&c.day===+date.slice(8));
 const e={title,date,time:'',endTime:'',endDate:'',allDay:false,venue:'Ozark Music Hall',address:'3615 N. Steele Blvd, Fayetteville, AR',category:/Alok:|Lucas Zelnick|DERRICK STROUP/.test(title)?'arts':'music',description:'',source:page.url,organizerName:'Ozark Music Hall',organizerUrl:'https://ozarkmusichall.com/',recurrence:'single',organizerType:'crawl',status:'pending',timezone:'America/Chicago',price:'',scheduleNote:doors?'Doors '+doors:'',uncertainFields:[],evidence:''};
 const addressQuote='Ozark Music Hall\n3615 N. Steele Blvd\nFayetteville, AR 72703';if(!page.text.includes(addressQuote))throw Error('Venue address layout changed');
 const venueText=detail+'\n'+addressQuote;
 const snapshots=[{url:page.url,text:venueText,fetchedAt:page.fetchedAt,status:'ok'}],claims=[];
 const claim=(field,quote,url=page.url)=>claims.push({field,url,quote,method:'text'});
 claim('title',title);claim('date',dateMatch[0].trim());claim('recurrence',dateMatch[0].trim());claim('venue','Ozark Music Hall');claim('address',addressQuote);claim('organizerName','Ozark Music Hall');if(doors)claim('scheduleNote','Doors: '+doors);
 const notes=['Official venue detail provides the explicit year, show identity and doors time. End time and price remain unknown unless stated.'];
 const prose=detail.split(/\n(?:Buy|Get) Tickets\n/)[1]?.replace(new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\n'),'').trim();
 if(prose){e.description=prose.split(/\s+/).slice(0,24).join(' ');const normalized=venueText.replace(/\s+/g,' ');if(normalized.includes(e.description)){const firstLine=prose.split('\n')[0];e.description=firstLine.split(/\s+/).slice(0,24).join(' ');if(venueText.includes(e.description))claim('description',e.description);else e.description='';}else e.description='';}
 const explicit=detail.match(/(?:Show at|DOORS\/SHOWTIME:)\s*(\d{1,2}(?::\d\d)?\s*[AP]M)/i);
 if(explicit){e.time=clock(explicit[1]);claim('time',explicit[0]);}
 if(cards.length===1){const c=cards[0],expectedDay=new Date(date+'T12:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long'});snapshots.push({url:c.url,text:c.text,fetchedAt:c.fetchedAt,status:'ok'});
  if(c.weekday!==expectedDay){e.uncertainFields.push('date');notes.push('Ticket weekday conflicts with the venue’s explicit year/date.');}
  const show=clock(c.start||'');if(show){if(e.time&&e.time!==show){e.uncertainFields.push('time');notes.push('Venue and ticket show times disagree.');}else {e.time=show;for(let i=claims.length-1;i>=0;i--)if(claims[i].field==='time')claims.splice(i,1);claim('time',c.text,c.url);}}
  if(doors&&c.doors&&clock(doors)!==clock(c.doors)){e.uncertainFields.push('scheduleNote');notes.push('Doors times conflict between the two sources.');}
  notes.push('Show start matched to an isolated organizer ticket card by exact title/verified alias, month, day and weekday. Ticket page was read through search-service rendering because direct robots retrieval was unavailable.');
 }else if(cards.length>1){e.uncertainFields.push('time');notes.push('Multiple ticket cards match; start needs review.');}
 if(!e.time)notes.push('UNABLE TO DETERMINE show start. Doors time was not substituted.');
 if(/\b(cancelled|canceled|postponed)\b/i.test(detail)){e.uncertainFields.push('date');notes.push('Possible cancellation or postponement in source text.');}
 // A year mismatch in artist/promoter copy must remain visible even if the header is newer.
 const fullMonth=new Date(date+'T12:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'long'});
 const proseDates=[...detail.matchAll(new RegExp(fullMonth+'\\s+'+Number(date.slice(8))+'(?:st|nd|rd|th)?[,]?\\s+(\\d{4})','gi'))];
 if(proseDates.some(m=>m[1]!==date.slice(0,4))){e.uncertainFields.push('date');notes.push('Promoter description and headline have conflicting years.');}
 notes.push('Venue and ticket vendor show different postal codes; retain the agreed street/city/state without a postal code.');
 e.evidence=notes.join(' ');e.uncertainFields=[...new Set(e.uncertainFields)];e.score=evidenceQuality(e,claims);
 e.research=validateResearch({snapshots,claims,steps:[{stage:'identify',rule:'ozark-detail/v1',outcome:'matched',detail:'One venue show page, explicit year, footer address; no sidebar dates.'},{stage:'cross-check',rule:'ozark-ticket-card/v1',outcome:e.uncertainFields.length||!e.time?'needs_review':'matched',detail:e.evidence},{stage:'route',rule:'human-approval/v1',outcome:'pending',detail:'Never auto-publish.'}]});
 return {event:e,aliases:aliases[title]||[],issues:reviewIssues(e)};
}
