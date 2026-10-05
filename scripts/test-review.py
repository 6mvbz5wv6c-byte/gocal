"""Local-only provenance, concurrency and normalized-write regression tests."""
import json,urllib.request,urllib.error,pathlib,secrets,concurrent.futures
BASE='http://127.0.0.1:8794';cookie='';checks=0
login=json.loads((pathlib.Path(__file__).resolve().parents[2]/'findout-private/admin-login.json').read_text())
def call(path,payload=None,expected=200):
 global checks
 req=urllib.request.Request(BASE+'/api/'+path,data=json.dumps(payload).encode() if payload is not None else None,headers={'Origin':BASE,'Cookie':cookie,'Content-Type':'application/json'})
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:r=e
 j=json.loads(r.read());checks+=1
 if expected is not None:assert r.status==expected,(path,r.status,j)
 return j,r
call('admin/evidence?id=FO-019',expected=401)
_,r=call('login',login);cookie=r.headers['Set-Cookie'].split(';')[0]
queue,_=call('admin/events');untouched=next(e for e in queue['events'] if e['id']=='FO-019')
stamp=secrets.token_hex(4);e={'title':'REVIEW TEST '+stamp,'date':'2026-11-10','time':'18:00','endTime':'20:00','venue':'Fixture '+stamp,'address':'1 Test St, Fayetteville, AR','category':'arts','description':'Local synthetic provenance fixture','source':'https://example.org/event','recurrence':'single','organizerName':'Fixture organizer '+stamp,'organizerUrl':'https://example.org/','organizerEmail':'fixture@example.org','organizerType':'community'}
call('events',e,201);queue,_=call('admin/events');record=next(x for x in queue['events'] if x['title']==e['title']);eid=record['id']
source='Fixture exact source. November 10, 2026. 6–8pm. <script>window.bad=true</script>'
research={'snapshots':[{'url':e['source'],'text':source,'status':'ok','fetchedAt':'2026-10-05T15:00:00Z'}],'claims':[{'field':'time','quote':'6–8pm','url':e['source'],'method':'text'}],'steps':[{'stage':'validate','rule':'fixture/v1','outcome':'pending','detail':'Synthetic source evidence test'}]}
b={'id':eid,'revision':record['revision'],'event':dict(e,research=research),'action':'enrich','reason':'Fixture enrichment'}
call('admin/event',b)
proof,_=call('admin/evidence?id='+eid);assert proof['snapshots'][0]['content_text']==source;assert len(proof['claims'])==1;assert proof['history'][0]['action']=='enrich'
queue,_=call('admin/events');record=next(x for x in queue['events'] if x['id']==eid);assert record['organizerEmail']=='fixture@example.org';assert next(x for x in queue['events'] if x['id']=='FO-019')==untouched
call('admin/event',dict(b,revision=record['revision'],action='approve',confirmed=True,event=dict(record,endTime='17:00')),400)
forged=json.loads(json.dumps(research));forged['claims'][0]['quote']='invented'
call('admin/event',dict(b,revision=record['revision'],event=dict(record,research=forged)),400)
oversized=json.loads(json.dumps(research));oversized['claims']*=30;oversized['steps']*=20
call('admin/event',dict(b,revision=record['revision'],event=dict(record,research=oversized)),400)
def concurrent_save(n):return call('admin/event',{'id':eid,'revision':record['revision'],'event':dict(record,title='RACE '+stamp+str(n),venue='Race venue '+str(n),organizerName='Race organizer '+str(n)),'action':'save','reason':'Fixture concurrent writer '+str(n)},None)[1].status
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:statuses=list(pool.map(concurrent_save,[1,2]))
assert sorted(statuses)==[200,409],statuses
queue,_=call('admin/events');winner=next(x for x in queue['events'] if x['id']==eid);n=winner['title'][-1];assert winner['venue']=='Race venue '+n;assert winner['organizerName']=='Race organizer '+n;assert next(x for x in queue['events'] if x['id']=='FO-019')==untouched
proof,_=call('admin/evidence?id='+eid);assert len(proof['history'])==2;assert proof['history'][0]['to_revision']==winner['revision'];assert proof['history'][0]['reason'].endswith(n)
call('admin/dashboard');runs,_=call('admin/runs');assert any(s['event_id']==eid for s in runs['steps']);call('admin/audit');call('logout',{})
print(f'{checks} review checks passed: evidence, forged quotes, completeness, contacts, record isolation, concurrent decisions, chain of custody and analytics.')
