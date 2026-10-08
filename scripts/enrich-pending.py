"""Apply an offline reprocessing plan with status/revision checks. Never publishes.
Credentials are read from a private file, never arguments, logs or the plan.
"""
import argparse,collections,json,pathlib,time,urllib.request,urllib.error,http.cookiejar,subprocess,tempfile
p=argparse.ArgumentParser();p.add_argument('plan');p.add_argument('--credentials',required=True);p.add_argument('--result',required=True);p.add_argument('--site',default='https://findout.events');a=p.parse_args()
if a.site not in ['https://findout.events','http://localhost:8794']:p.error('Only FindOut or the local test Worker is allowed')
private=tempfile.TemporaryDirectory();cookie=str(pathlib.Path(private.name)/'session')
class APIError(Exception):
 def __init__(self,code,detail):self.code,self.detail=code,detail;super().__init__(f'API status {code}: {detail}')
def call(path,data=None):
 args=['curl','--silent','--show-error','--connect-timeout','15','--max-time','40','-b',cookie,'-c',cookie,'-w','\n%{http_code}',a.site+'/api/'+path]
 if data is not None:args+=['-H','Origin: '+a.site,'-H','Content-Type: application/json','--data-binary','@-']
 response=subprocess.run(args,input=json.dumps(data) if data is not None else None,text=True,capture_output=True)
 if response.returncode:raise APIError(0,'Network request failed')
 raw,code=response.stdout.rsplit('\n',1);code=int(code)
 if code>=400:raise APIError(code,raw[:300])
 return json.loads(raw)
def read_all():return [e for status in ['pending','approved','rejected','removed'] for e in call('admin/events?status='+status)['events']]
plan=json.loads(pathlib.Path(a.plan).read_text());result={'enriched':[],'skipped':[],'failed':[]};out=pathlib.Path(a.result)
def save():out.write_text(json.dumps(result,indent=2));out.chmod(0o600)
call('login',json.loads(pathlib.Path(a.credentials).read_text()))
try:
 before=read_all();result['beforeCounts']=dict(collections.Counter(e['status'] for e in before));revisions={e['id']:(e['status'],e['revision']) for e in before}
 for i,entry in enumerate(plan['enrich']):
  identity=entry['id'];old=next((e for e in before if e['id']==identity),None)
  if not old or old['status']!='pending' or old['revision']!=entry['revision']:
   result['skipped'].append({'id':identity,'reason':'Record changed since capture'});save();continue
  e=entry['event'];payload={'id':identity,'revision':entry['revision'],'event':e,'action':'enrich','reason':'Bounded source refresh; visible/structured cross-check v2. '+e['evidence'][:900]+' Evidence score uses applicable-fields/v2; missing optional values excluded. Human approval still required.'}
  try:
   call('admin/event',payload);result['enriched'].append({'id':identity,'title':e['title'],'scoreBefore':entry['oldScore'],'scoreAfter':entry['newScore'],'sameFormulaAfter':entry['sameFormulaScore'],'changed':entry['changed']});print(f'{i+1}/{len(plan["enrich"])} enriched {identity}',flush=True)
  except APIError as err:
   detail=err.detail;result['failed'].append({'id':identity,'status':err.code,'detail':detail});print('Stopped:',err.code,detail,flush=True);save();break
  save();time.sleep(1.3)
 after=read_all();result['afterCounts']=dict(collections.Counter(e['status'] for e in after));result['changedNonpending']=[e['id'] for e in after if e['id'] in revisions and revisions[e['id']][0]!='pending' and (e['status'],e['revision'])!=revisions[e['id']]];result['remainingBlockers']=sum(bool(e['issues']) for e in after if e['status']=='pending');save();print(json.dumps({k:v for k,v in result.items() if k not in ['enriched','skipped','failed']}),flush=True)
finally:
 try:call('logout',{})
 finally:private.cleanup()
