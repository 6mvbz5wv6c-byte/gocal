import test from 'node:test';
import assert from 'node:assert/strict';
import {regionToday,upcomingEntries} from '../src/lib/event-schedule.js';
const event=(id,date,more={})=>({id,title:id,date,time:'19:00',...more});
test('feed starts today and sorts into future months, independent of input order',()=>{
 const rows=upcomingEntries([event('future','2027-01-01'),event('past','2026-10-10'),event('late','2026-10-11'),event('early','2026-10-11',{time:'09:00'})],'2026-10-11');
 assert.deepEqual(rows.map(r=>r.event.id),['early','late','future']);
});
test('ongoing festivals remain one row dated today; finished festivals disappear',()=>{
 const rows=upcomingEntries([event('active','2026-10-09',{endDate:'2026-10-15'}),event('done','2026-10-08',{endDate:'2026-10-10'})],'2026-10-11');
 assert.equal(rows.length,1);assert.equal(rows[0].date,'2026-10-11');assert.equal(rows[0].event.date,'2026-10-09');
});
test('explicit opening sessions use next open day, never a closed day or old session',()=>{
 const e=event('voting','2026-10-01',{endDate:'2026-10-20',sessions:[{date:'2026-10-15',startTime:'08:00'},{date:'2026-10-09',startTime:'08:00'},{date:'2026-10-12',startTime:'09:00'}]});
 assert.equal(upcomingEntries([e],'2026-10-11')[0].date,'2026-10-12');
 assert.equal(upcomingEntries([e],'2026-10-11','2026-10-13').length,0);
 assert.equal(upcomingEntries([e],'2026-10-16').length,0);
});
test('midnight finishes do not show yesterday’s event, after-midnight ranges do',()=>{
 assert.equal(upcomingEntries([event('midnight','2026-10-10',{endDate:'2026-10-11',endTime:'00:00'})],'2026-10-11').length,0);
 assert.equal(upcomingEntries([event('overnight','2026-10-10',{endDate:'2026-10-11',endTime:'01:00'})],'2026-10-11').length,1);
});
test('focus filters the selected day but never reintroduces past days',()=>{
 const es=[event('today','2026-10-11'),event('tomorrow','2026-10-12')];
 assert.deepEqual(upcomingEntries(es,'2026-10-11','2026-10-12').map(r=>r.event.id),['tomorrow']);
 assert.equal(upcomingEntries(es,'2026-10-12','2026-10-11').length,0);
});
test('today uses Central Time at midnight and across daylight saving changes',()=>{
 assert.equal(regionToday(new Date('2026-10-12T04:59:00Z')),'2026-10-11');
 assert.equal(regionToday(new Date('2026-10-12T05:00:00Z')),'2026-10-12');
 assert.equal(regionToday(new Date('2026-11-02T05:59:00Z')),'2026-11-01');
 assert.equal(regionToday(new Date('2026-11-02T06:00:00Z')),'2026-11-02');
});
