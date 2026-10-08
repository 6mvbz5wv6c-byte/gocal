"""Local-only integration contract for quick review and evidence score integrity."""
import json,pathlib,secrets,urllib.request,urllib.error
BASE='http://localhost:8794';cookie='';checks=0
login=json.loads((pathlib.Path(__file__).resolve().parents[2]/'findout-private/admin-login.json').read_text())
def call(path,data=None,status=200):
 global checks
 req=urllib.request.Request(BASE+'/api/'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Origin':BASE,'Cookie':cookie,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.101'})
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as err:r=err
 payload=json.loads(r.read());assert r.status==status,(path,r.status,payload);checks+=1;return payload,r
_,r=call('login',login);cookie=r.headers['Set-Cookie'].split(';')[0]
try:
 stamp=secrets.token_hex(4);event={'title':'LOCAL INLINE '+stamp,'category':'community','date':'2026-11-10','time':'18:00','source':'https://example.org/'+stamp}
 call('events',event,201)
 def current(status='pending'):
  return next(e for e in call('admin/events?status='+status)[0]['events'] if e['title']==event['title'])
 row=current();assert row['issues']==[]
 text=event['title']+' November 10, 2026 at 18:00';research={'snapshots':[{'url':event['source'],'text':text,'fetchedAt':'2026-10-08T12:00:00Z','status':'ok'}],'claims':[{'field':f,'quote':q,'url':event['source'],'method':'text'} for f,q in [('title',event['title']),('date','November 10, 2026'),('time','18:00')]],'steps':[]}
 def edit(row,action='save',**patch):return {'id':row['id'],'revision':row['revision'],'event':dict(row,**patch),'action':action,'confirmed':action=='approve','reason':'Synthetic local inline review'}
 call('admin/event',edit(row,'enrich',research=research));row=current();assert row['score']==100
 # A client cannot keep 100 after replacing a field and losing its evidence.
 call('admin/event',edit(row,time='19:00',score=100));changed=current();assert changed['score']<100
 call('admin/event',edit(row,'approve'),409)
 # Inferred fields cannot bypass human checks by omitting uncertainFields.
 inferred=json.loads(json.dumps(research));inferred['claims'][-1]['method']='inferred'
 call('admin/event',edit(changed,'approve',research=inferred,uncertainFields=[]),400)
 call('admin/event',edit(changed,'approve',recurrence='rule',rrule=''),400)
 call('admin/event',edit(changed,'approve'))
 approved=current('approved');assert approved['status']=='approved';assert approved['venue']=='';assert approved['address']=='';assert not approved['endTime']
 proof=call('admin/evidence?id='+row['id'])[0];assert len(proof['history'])==3;assert all(c['field']!='time' for c in proof['claims'])
 print(f'{checks} inline review API checks passed: optional fields, score tampering, dropped stale claims, inferred flags, revision conflicts, and approval history.')
finally:call('logout',{})
