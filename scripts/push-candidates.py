#!/usr/bin/env python3
"""Push a locally reviewed crawl file into FindOut!'s pending queue. Never publishes."""
import argparse,json,os,urllib.request,urllib.parse
p=argparse.ArgumentParser();p.add_argument('file');p.add_argument('--site',default='https://findout.events');p.add_argument('--summary',default='Local crawl import');p.add_argument('--start-index',type=int,default=0,help='Resume at this zero-based event after a daily rate limit');args=p.parse_args()
u=urllib.parse.urlparse(args.site)
if u.scheme!='https' or u.hostname not in ('findout.events','findout.6mvbz5wv6c.workers.dev'):p.error('Use the FindOut HTTPS origin.')
token=os.environ.get('FINDOUT_AGENT_TOKEN')
if not token:p.error('Set FINDOUT_AGENT_TOKEN from Manage FindOut → Local agents.')
data=json.load(open(args.file));events=data['events'] if isinstance(data,dict) else data
for offset in range(args.start_index,len(events)):
 batch=[]
 for original in events[offset:offset+1]:
  e=dict(original)
  for key in ['time','endTime','endDate','address','price','description','source']:e[key]=e.get(key) or ''
  e['evidence']=e.get('evidence') or e.get('evidenceSummary') or 'Local crawl candidate; verify original source.'
  e['organizerType']='crawl';batch.append(e)
 body=json.dumps({'events':batch,'summary':args.summary}).encode()
 if len(body)>64000:p.error('Batch exceeds 64 KB; shorten evidence fields.')
 req=urllib.request.Request(args.site.rstrip('/')+'/api/agent/ingest',data=body,headers={'Content-Type':'application/json','Authorization':'Bearer '+token,'User-Agent':'FindOutLocalImporter/1.0'})
 with urllib.request.urlopen(req,timeout=30) as r:result=json.load(r)
 print(f"Batch {offset+1}: {result['inserted']} added as pending")
