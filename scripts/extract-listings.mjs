#!/usr/bin/env node
// Offline extraction only. Use push-candidates.py separately for pending intake.
import {readFileSync} from 'node:fs';
import {extractListings} from '../crawler/listings.js';
if(process.argv.length!==3){console.error('Usage: node scripts/extract-listings.mjs captured-listings.json > candidates.json');process.exit(1);}
try{console.log(JSON.stringify(extractListings(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));}
catch(error){console.error(error.message);process.exitCode=1;}
