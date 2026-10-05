import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCandidates} from '../crawler/reconcile.js';
const event={title:'Kurt Vile And The Violators with Twisted Teens',date:'2026-11-16',time:'20:00',venue:"George's Majestic Lounge"};
const candidate={event,aliases:['Kurt Vile And The Violators']};
test('captured headliner alias matches an approved event without a duplicate or mutation',()=>{
 const old={...event,title:candidate.aliases[0],status:'approved',revision:4};const before=structuredClone(old);
 const p=reconcileCandidates([candidate],[old]);assert.equal(p.add.length,0);assert.equal(p.matched.length,1);assert.deepEqual(old,before);assert.equal(p.matched[0].existing.status,'approved');
});
test('pending, rejected and removed matches are retained as existing decisions',()=>{
 for(const status of ['pending','rejected','removed']){const p=reconcileCandidates([candidate],[{...event,status}]);assert.equal(p.add.length,0);assert.equal(p.matched[0].existing.status,status);}
});
test('different date or venue remains a distinct occurrence',()=>{
 const p=reconcileCandidates([candidate],[{...event,date:'2026-11-17'},{...event,venue:'Another venue'}]);assert.equal(p.add.length,1);
});
test('start-time conflicts and ambiguous duplicates require review',()=>{
 assert.equal(reconcileCandidates([candidate],[{...event,time:'19:00'}]).conflicts.length,1);
 assert.equal(reconcileCandidates([candidate],[event,{...event}]).conflicts.length,1);
});
test('similar artist titles without a verified alias do not match by prefix',()=>{
 assert.equal(reconcileCandidates([{event}], [{...event,title:'Kurt Vile'}]).add.length,1);
});
