import test from 'node:test';
import assert from 'node:assert/strict';
import {extractListings} from '../crawler/listings.js';
import {validateResearch} from '../server/records.js';

const text="Kurt Vile And The Violators with Twisted Teens Nov 16th 8:00PM (Mon) DOORS 7:00PM George's Majestic Lounge PURCHASE PURCHASE Cat Clyde & Dean Johnson Nov 17th 8:00PM (Tue) DOORS 7:00PM George's Majestic Lounge PURCHASE PURCHASE Happy Hour co bill with Raised on Radio + No Vacancy Nov 20th 6:00PM (Fri) DOORS 5:00PM George's Majes";
// Synthetic supporting captures: these are test fixtures, not live crawl evidence.
const context={url:'https://venue.example/about',venue:"George's Majestic Lounge",address:'519 W Dickson St, Fayetteville, AR 72701',organizerName:"George's Majestic Lounge",organizerUrl:'https://venue.example/'};
context.text=Object.values(context).join('\n');
const args={text,url:'https://venue.example/calendar',fetchedAt:'2026-10-05T12:00:00Z',yearContext:{year:2026,url:'https://venue.example/calendar',text:'November 2026 calendar',quote:'November 2026 calendar'},venueContext:context};
test('the exact three-show example creates three separate pending events with correct start/doors times',()=>{
 const r=extractListings(args);
 assert.equal(r.events.length,3);assert.equal(r.issues.length,0);
 assert.deepEqual(r.events.map(e=>[e.title,e.date,e.time]),[
  ['Kurt Vile And The Violators with Twisted Teens','2026-11-16','20:00'],
  ['Cat Clyde & Dean Johnson','2026-11-17','20:00'],
  ['Happy Hour co bill with Raised on Radio + No Vacancy','2026-11-20','18:00']]);
 assert.deepEqual(r.results.map(x=>x.doorsTime),['19:00','19:00','17:00']);
 for(const e of r.events){assert.equal(e.status,'pending');assert.equal(e.endTime,'');assert.equal(e.recurrence,'single');assert.doesNotMatch(e.description,/PURCHASE/);validateResearch(e.research);}
 assert.equal(r.results[0].complete,true);assert.equal(r.results[1].complete,true);
 assert.equal(r.results[2].complete,false);assert.ok(r.events[2].uncertainFields.includes('venue'));assert.equal(r.events[2].address,'');
});
test('event-specific descriptions and field claims never contain a neighboring show',()=>{
 const r=extractListings(args);
 for(const [index,e] of r.events.entries())for(const [other,o] of r.events.entries())if(index!==other){assert.ok(!e.description.includes(o.title));for(const c of e.research.claims)assert.ok(!c.quote.includes(o.title));}
 assert.match(r.events[0].description,/DOORS 7:00PM/);assert.doesNotMatch(r.events[0].description,/5:00PM|Nov 20/);
});
test('missing year remains unknown; a supplied year requires a supporting quote',()=>{
 const r=extractListings({...args,yearContext:undefined});assert.ok(r.events.every(e=>!e.date));assert.ok(r.results.every(x=>!x.complete));
 assert.throws(()=>extractListings({...args,yearContext:{...args.yearContext,quote:'2027'}}),/Year requires/);
});
test('explicit year works without page context; weekday and year conflicts are flagged',()=>{
 const inline=text.replaceAll(/Nov (\d+)th/g,'Nov $1th 2026');
 assert.equal(extractListings({...args,text:inline,yearContext:undefined}).events[0].date,'2026-11-16');
 assert.ok(extractListings({...args,text:text.replace('(Mon)','(Tue)')}).events[0].uncertainFields.includes('date'));
 assert.ok(extractListings({...args,text:inline.replace('2026','2027')}).events[0].uncertainFields.includes('date'));
});
test('missing purchase boundaries fail closed instead of merging shows',()=>{
 const r=extractListings({...args,text:text.replaceAll('PURCHASE','')});assert.equal(r.events.length,0);assert.equal(r.issues[0].code,'boundary');
});
test('repeated ticket cards deduplicate but distinct dates remain separate',()=>{
 const card=text.split(' PURCHASE')[0];
 assert.equal(extractListings({...args,text:card+' PURCHASE '+card}).events.length,1);
 assert.equal(extractListings({...args,text:card+' PURCHASE '+card.replace('16th','17th').replace('(Mon)','(Tue)')}).events.length,2);
});
test('impossible dates and invalid clock hours are flagged; noon and midnight parse correctly',()=>{
 assert.equal(extractListings({...args,text:text.replace('Nov 16th','Nov 31st')}).events[0].date,'');
 assert.equal(extractListings({...args,text:text.replace('8:00PM','13:00PM')}).events[0].time,'');
 assert.equal(extractListings({...args,text:text.replace('8:00PM','12:00PM')}).events[0].time,'12:00');
 assert.equal(extractListings({...args,text:text.replace('8:00PM','12:00AM')}).events[0].time,'00:00');
});
test('cancellations and missing venue context cannot be ready',()=>{
 assert.equal(extractListings({...args,text:'CANCELED '+text}).results[0].complete,false);
 assert.ok(extractListings({...args,venueContext:undefined}).results.every(r=>!r.complete));
});
test('bounded inputs, HTTPS source and context evidence are enforced',()=>{
 assert.throws(()=>extractListings({...args,text:'a'.repeat(18001)}),/18,000/);
 assert.throws(()=>extractListings({...args,url:'javascript:alert(1)'}),/HTTPS/);
 const r=extractListings({...args,venueContext:{...context,text:"George's Majestic Lounge"}});assert.equal(r.events[0].address,'');assert.equal(r.events[0].organizerUrl,'');
});
test('verified venue data outside the configured geography still needs review',()=>{
 const elsewhere={...context,address:'123 Main St, Bentonville, AR 72712'};elsewhere.text=Object.values(elsewhere).join('\n');
 assert.ok(extractListings({...args,venueContext:elsewhere}).events[0].uncertainFields.includes('address'));
 assert.equal(extractListings({...args,venueContext:elsewhere,allowedCities:['Fayetteville','Bentonville']}).results[0].complete,true);
});
