export const categories = [
 {id:'music',name:'Music & nightlife',color:'#285db4',bg:'#e1edffde'},
 {id:'arts',name:'Arts & making',color:'#a94912',bg:'#ffecd9e8'},
 {id:'community',name:'Community',color:'#12618b',bg:'#dff4ffe3'},
 {id:'outdoors',name:'Outdoors & movement',color:'#396b87',bg:'#e6f0f8e8'},
 {id:'food',name:'Food & drink',color:'#a24530',bg:'#ffe5dce5'},
 {id:'learning',name:'Classes & learning',color:'#795506',bg:'#fff3bfe5'},
];
export type CalEvent={id:string;title:string;date:string;time:string;endTime?:string;endDate?:string;recurrence?:string;organizerName?:string;organizerUrl?:string;organizerEmail?:string;organizerPhone?:string;venue:string;address?:string;category:string;price:string;description:string;sourceSummary?:string;source?:string;sample?:boolean;status?:string;score?:number;evidence?:string;organizerType?:string};
const examples=[
 ['Open mic, open minds','music','18:30','The neighborhood coffeehouse','Free','A little music, a little poetry, and a room full of new faces. Bring something to share or just come listen.'],
 ['Clay & conversation','arts','17:00','Community pottery studio','$25','An easygoing introduction to hand-building. No experience needed; materials and good company included.'],
 ['A walk with new friends','outdoors','09:00','Razorback Greenway','Free','A relaxed morning walk. Meet at the trail entrance and explore at a conversational pace.'],
 ['Neighborhood potluck','food','18:00','Community garden','Free','Bring a favorite dish, a friend, or just yourself. Everyone has a place at the table.'],
 ['Live jazz after hours','music','20:00','Downtown listening room','$10','Settle in for an intimate evening of local musicians and improvised sounds.'],
 ['Neighborhood makers market','community','09:00','Town square','Free','Meet your local makers, browse handmade goods, and spend your morning outside.'],
 ['Golden hour photo walk','arts','17:30','Downtown Fayetteville','Free','See familiar streets in a new light. Phone cameras welcome. We will stop often and share what catches our eye.'],
 ['Help grow the garden','outdoors','10:00','Neighborhood garden','Free','An open volunteer morning planting, weeding, and getting to know your neighbors.'],
 ['Stories on stage','arts','19:00','Local community theater','$15','An evening of short plays from local writers. Come support a little homegrown creativity.'],
 ['Learn to mend','learning','14:00','Community workshop','$12','Bring a garment and learn a few useful stitches. A practical afternoon of repair and conversation.'],
 ['Coffee with strangers','food','10:00','Neighborhood café','Free','An open table for anyone who wants to meet someone new. Buy your own coffee; conversation is on us.'],
 ['Community town hall','community','18:00','Neighborhood meeting hall','Free','Show up, listen, and help shape the place we call home. Open to all neighbors.']
];
export function sampleEvents():CalEvent[]{return Array.from({length:37},(_,i)=>{const a=examples[i%examples.length];const day=1+((i*5+Math.floor(i/12))%31);return {id:`sample-${i}`,title:a[0],category:a[1],time:a[2],venue:a[3],price:a[4],description:a[5],date:`2026-10-${String(day).padStart(2,'0')}`,sample:true};}).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}
export function timeLabel(time:string){if(!/^\d{2}:\d{2}$/.test(time))return 'Time unconfirmed';const [h,m]=time.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''}${h>=12?'pm':'am'}`;}
export function localDate(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

export function priceLabel(price?:string){const value=price?.trim()||'';return /^(?:check organizer|unknown|tbd|tba|unable to determine)[.!]?$/i.test(value)?'':value;}
