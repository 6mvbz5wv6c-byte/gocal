import {readFileSync,writeFileSync} from 'node:fs';
import {extractCapturedPage} from '../crawler/captured-page.js';
import {reviewIssues,evidenceQuality} from '../src/lib/review.js';
const [pendingFile,captureFile,outputFile]=process.argv.slice(2);
if(!outputFile)throw Error('Usage: node scripts/reprocess-pending.mjs pending.json captures.json plan.json');
const rows=JSON.parse(readFileSync(pendingFile)),captures=JSON.parse(readFileSync(captureFile));
if(rows.some(e=>e.status!=='pending'))throw Error('Only pending events can be reprocessed');
const result={enrich:[],unchanged:[],errors:[],metrics:{total:rows.length}};
for(const old of rows){try{
 const capture=captures.find(c=>c.url===old.source),r=extractCapturedPage(capture,old);if(!r.event){result.unchanged.push({id:old.id,title:old.title,reason:r.reason});continue}
 const candidate=r.event;
 // Identity must still match before filling an existing record. Dates are not silently moved.
 const normalized=s=>s.toLowerCase().replace(/^tentative:\s*/,'').replace(/[^a-z0-9]+/g,' ').trim();
 if(normalized(old.title)!==normalized(candidate.title)){result.errors.push({id:old.id,title:old.title,reason:'Title identity changed'});continue}
 if(old.date!==candidate.date||old.time!==candidate.time){candidate.uncertainFields=[...new Set([...candidate.uncertainFields,...(old.date!==candidate.date?['date']:[]),...(old.time!==candidate.time?['time']:[])])];candidate.evidence+=' Previous pending schedule differs: '+old.date+' '+old.time+'.';}
 const merged={...old,...candidate};
 if(old.date&&candidate.date!==old.date)merged.date=old.date;
 if(old.time&&candidate.time!==old.time)merged.time=old.time;
 // Preserve human-added details absent from current capture; new claims must not pretend to support them.
 for(const field of ['price','organizerName','organizerUrl','organizerPhone','organizerEmail','address','venue','description','scheduleNote'])if(!merged[field]||merged[field]==='Check organizer')merged[field]=old[field]||'';
 merged.score=evidenceQuality(merged,merged.research.claims);
 merged.research.steps.push({stage:'capture',rule:'bounded-source-fetch/v1',outcome:'refreshed',detail:'Fetched '+capture.fetchedAt+'; body SHA-256 '+capture.contentHash+'; identical content may retain its first snapshot timestamp.'});
 const changed=['title','date','time','endTime','endDate','venue','address','description','uncertainFields'].filter(f=>JSON.stringify(old[f]||'')!==JSON.stringify(merged[f]||''));
 result.enrich.push({id:old.id,revision:old.revision,event:merged,changed,oldScore:old.score,newScore:merged.score,oldBlockers:old.issues.length,newBlockers:reviewIssues(merged).length,newEvidenceFields:merged.research.claims.map(c=>c.field),sameFormulaScore:Math.round(100*['title','date','time','endTime','venue','address','recurrence','organizerName'].filter(f=>merged[f]&&!merged.uncertainFields.includes(f)&&merged.research.claims.some(c=>c.field===f&&c.method!=='inferred')).length/8)});
}catch(e){result.errors.push({id:old.id,title:old.title,reason:e.message})}}
result.metrics={...result.metrics,extracted:result.enrich.length,unsupported:result.unchanged.length,errors:result.errors.length,venueFilled:result.enrich.filter(r=>!rows.find(e=>e.id===r.id).venue&&r.event.venue).length,sameFormulaImproved:result.enrich.filter(r=>r.sameFormulaScore>r.oldScore).length,scoreIncreased:result.enrich.filter(r=>r.newScore>r.oldScore).length,ready:result.enrich.filter(r=>r.newBlockers===0).length,conflicts:result.enrich.filter(r=>r.event.uncertainFields.length>0).length};
writeFileSync(outputFile,JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result.metrics,null,2));
