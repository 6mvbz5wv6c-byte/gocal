// Offline comparison: same frozen captures, metadata-only vs visible cross-check.
import {readFileSync,writeFileSync} from 'node:fs';
import {extractEvent} from '../crawler/extract.js';
import {extractCapturedPage} from '../crawler/captured-page.js';
const [pendingPath,capturePath,out]=process.argv.slice(2);if(!out)throw Error('Usage: node scripts/benchmark-crawl.mjs pending.json captures.json report.json');
const pending=JSON.parse(readFileSync(pendingPath)),captures=JSON.parse(readFileSync(capturePath));const rows=[];
for(const old of pending){const c=captures.find(c=>c.url===old.source);if(c?.status!=='ok'||!c.documents?.length)continue;const args={document:c.documents,expectedTitle:old.title,url:c.url,fetchedAt:c.fetchedAt,category:old.category,allowedCities:['Fayetteville','Bentonville','Rogers']};const a=extractEvent(args),b=extractCapturedPage(c,old);if(!a.event)continue;rows.push({title:old.title,source:c.url,metadataOnlyReady:a.complete,crossCheckedReady:b.complete,conflicts:b.issues.filter(i=>i.code==='conflict').map(i=>({field:i.field,message:i.message}))})}
const report={method:'Same-source metadata and visible text agreement is corroboration, not independent verification. Ready means a human may review; never auto-publish.',compared:rows.length,metadataOnlyReady:rows.filter(r=>r.metadataOnlyReady).length,crossCheckedReady:rows.filter(r=>r.crossCheckedReady).length,conflictingRecords:rows.filter(r=>r.conflicts.length).length,rows};writeFileSync(out,JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify({...report,rows:undefined}));
