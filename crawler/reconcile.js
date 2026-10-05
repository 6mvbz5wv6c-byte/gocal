const key=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();

// Aliases must be exact names captured from the same linked event detail page,
// never fuzzy matches. Repeated shows on different dates remain separate.
export function reconcileCandidates(candidates,existing){
 const plan={add:[],matched:[],conflicts:[]};
 for(const candidate of candidates){
  const event=candidate.event||candidate;
  const names=new Set([event.title,...(candidate.aliases||[])].map(key));
  const matches=existing.filter(old=>key(old.venue)===key(event.venue)&&old.date===event.date&&names.has(key(old.title)));
  if(matches.length===0){plan.add.push(candidate);continue;}
  if(matches.length!==1){plan.conflicts.push({candidate,existing:matches,reason:'Multiple existing records match the same title, date and venue.'});continue;}
  const old=matches[0];
  if(old.time!==event.time){plan.conflicts.push({candidate,existing:matches,reason:'Start time differs; do not add a duplicate or replace a reviewed time.'});continue;}
  const differences=['title','endTime','endDate','address','price','description','organizerName','organizerUrl'].filter(field=>(old[field]||'')!==(event[field]||''));
  plan.matched.push({candidate,existing:old,differences});
 }
 return plan;
}
