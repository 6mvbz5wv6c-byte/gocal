// Notes are optional. The ledger already stores actor, action and before/after
// revisions; an automatic summary makes confirmations legible without typing.
export function decisionReason(action, previous, next, note='') {
 const confirmed=(previous.uncertainFields||[]).filter(field=>!(next.uncertainFields||[]).includes(field));
 const summary=({approve:'Approved by reviewer.',reject:'Denied by reviewer.',save:'Edits saved for review.',remove:'Unpublished by reviewer.',enrich:'Source evidence refreshed.'})[action]||'Review decision recorded.';
 return [note.trim()||summary,confirmed.length?'Confirmed fields: '+confirmed.join(', ')+'.':''].filter(Boolean).join(' ').slice(0,1500);
}
