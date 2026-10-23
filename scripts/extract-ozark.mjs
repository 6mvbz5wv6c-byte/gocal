import {readFileSync,writeFileSync} from 'node:fs';
import {extractOzark} from '../crawler/ozark.js';
import {reconcileCandidates} from '../crawler/reconcile.js';
const [detailsPath,cardsPath,existingPath,output]=process.argv.slice(2);if(!output)throw Error('Usage: extract-ozark.mjs details.json ticket-cards.json existing.json output.json');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const candidates=read(detailsPath).map(page=>extractOzark({page,ticketCards:read(cardsPath)}));
// Same-source or historical venue-name matches are held for review, not duplicated.
const existing=read(existingPath).map(e=>({...e,venue:/^(?:jj[’']?s live|ozark music hall)$/i.test(e.venue)?'Ozark Music Hall':e.venue}));
const plan=reconcileCandidates(candidates,existing),sourceMatches=plan.add.filter(c=>existing.some(e=>e.source===c.event.source&&e.date===c.event.date));
plan.add=plan.add.filter(c=>!sourceMatches.includes(c));plan.conflicts.push(...sourceMatches.map(candidate=>({candidate,reason:'Existing same-source occurrence; verify title/time changes.'})));
writeFileSync(output,JSON.stringify({...plan,events:plan.add.map(c=>c.event)},null,2),{mode:0o600});
console.log(JSON.stringify({found:candidates.length,add:plan.add.length,matched:plan.matched.length,conflicts:plan.conflicts.length,missingStart:plan.add.filter(c=>!c.event.time).map(c=>c.event.title),blockers:plan.add.filter(c=>c.issues.length).map(c=>({title:c.event.title,issues:c.issues}))},null,2));
