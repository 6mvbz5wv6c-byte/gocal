import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionReason} from '../server/moderation.js';

test('every moderation action records a summary when the note is absent or blank',()=>{
 for(const action of ['approve','reject','save','remove','enrich']){
  assert.ok(decisionReason(action,{},{}));
  assert.equal(decisionReason(action,{},{}),decisionReason(action,{}, {},'  '));
 }
});
test('confirmed fields are recorded without requiring a reason; unresolved fields remain excluded',()=>{
 const previous={uncertainFields:['address','time']},next={uncertainFields:['time']};
 assert.equal(decisionReason('save',previous,next),'Edits saved for review. Confirmed fields: address.');
 assert.equal(decisionReason('approve',previous,{uncertainFields:[]},'Checked organizer'),'Checked organizer Confirmed fields: address, time.');
 assert.equal(decisionReason('save',previous,previous),'Edits saved for review.');
});
