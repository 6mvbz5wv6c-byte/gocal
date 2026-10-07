import fs from 'node:fs';
import {extractCivicMeeting} from '../crawler/civic.js';
const [path,from,through]=process.argv.slice(2);
if(!path||!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(through||'')||from>through)throw Error('Usage: node scripts/extract-civics.mjs captures.json YYYY-MM-DD YYYY-MM-DD');
const captures=JSON.parse(fs.readFileSync(path,'utf8'));
if(!Array.isArray(captures)||captures.length>500)throw Error('Expected at most 500 captured detail pages');
const events=[],skipped=[];
for(const page of captures){if(!page.fetchedAt)throw Error('Each capture needs its actual fetchedAt timestamp');const r=extractCivicMeeting({...page,from,through});if(r.event)events.push(r.event);else skipped.push({url:page.url,reason:r.reason})}
console.log(JSON.stringify({events,skipped},null,2));
