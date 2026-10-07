"""Local-only integration tests for civic notices, approval, custody and daily sessions."""
import json,urllib.request,urllib.error,pathlib,secrets,hashlib
BASE='http://127.0.0.1:8794';cookie='';checks=0
login=json.loads((pathlib.Path(__file__).resolve().parents[2]/'findout-private/admin-login.json').read_text())
def call(path,payload=None,status=200,bearer=None):
 global checks
 headers={'Origin':BASE,'Cookie':cookie,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.'+str(50+checks)}
 if bearer:headers['Authorization']='Bearer '+bearer
 req=urllib.request.Request(BASE+'/api/'+path,data=None if payload is None else json.dumps(payload).encode(),headers=headers)
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:r=e
 data=json.loads(r.read());assert r.status==status,(path,r.status,data);checks+=1;return data,r.headers
_,h=call('login',login);cookie=h['Set-Cookie'].split(';')[0]
t,_=call('admin/tokens',{'label':'LOCAL civic integration'});token=t['token']
source='https://www.washingtoncountyar.gov/government/departments-a-e/election-commission/'
base={'title':'LOCAL VOTING '+secrets.token_hex(4),'category':'civics','date':'2026-10-19','endDate':'2026-11-02','time':'08:00','endTime':'17:00','recurrence':'range','venue':'Test Courthouse','address':'1 Test St, Fayetteville AR','description':'Local test only','source':source,'organizerName':'Test authority','organizerUrl':source,'civicNotice':'early-voting','sessions':[{'date':'2026-10-19','startTime':'08:00','endTime':'18:00'},{'date':'2026-11-02','startTime':'08:00','endTime':'17:00'}]}
base['research']={'snapshots':[{'url':source,'text':'Local fixture: October 19, 2026 08:00–18:00; November 2, 2026 08:00–17:00.','fetchedAt':'2026-10-07T12:00:00Z','status':'ok'}],'claims':[{'field':'sessions','url':source,'quote':'October 19, 2026 08:00–18:00; November 2, 2026 08:00–17:00.','method':'text'}],'steps':[]}
try:
 r,_=call('agent/ingest',{'events':[base],'summary':'Local synthetic fixture only'},bearer=token);assert r['inserted']==1
 rows,_=call('admin/events');e=next(x for x in rows['events'] if x['title']==base['title']);assert e['sessions']==base['sessions'];assert e['issues']==[]
 public,_=call('events');assert not any(x['id']==e['id'] for x in public['events'])
 call('admin/event',{'id':e['id'],'revision':e['revision'],'action':'approve','confirmed':True,'event':e})
 public,_=call('events');found=next(x for x in public['events'] if x['id']==e['id']);assert found['sessions']==base['sessions'];assert found['civicNotice']=='early-voting'
 changed={**e,'sessions':[base['sessions'][0],{'date':'2026-11-02','startTime':'09:00','endTime':'17:00'}]}
 call('admin/event',{'id':e['id'],'revision':e['revision'],'action':'save','event':changed},409)
 rows,_=call('admin/events?status=approved');assert next(x for x in rows['events'] if x['id']==e['id'])['sessions']==base['sessions']
 hist,_=call('admin/evidence?id='+e['id']);assert json.loads(hist['history'][0]['after_json'])['sessions']==base['sessions'];assert any(c['field']=='sessions' for c in hist['claims'])
 # Notice lookup is explicit; no invented Election Day street address.
 election={**base,'title':base['title']+' election','date':'2026-11-03','endDate':'','time':'07:30','endTime':'19:30','civicNotice':'election-day','address':'','locationUrl':source,'sessions':[{'date':'2026-11-03','startTime':'07:30','endTime':'19:30'}],'recurrence':'single'}
 call('agent/ingest',{'events':[election]},bearer=token)
 rows,_=call('admin/events');day=next(x for x in rows['events'] if x['title']==election['title']);assert day['issues']==[]
 call('admin/event',{'id':day['id'],'revision':day['revision'],'action':'approve','confirmed':True,'event':day})
 for sessions in [[None],None,[*base['sessions'],base['sessions'][0]],[{'date':'2026-02-30','startTime':'08:00','endTime':'18:00'}]]:
  call('agent/ingest',{'events':[{**base,'sessions':sessions}]},400,bearer=token)
 bad={**base,'title':base['title']+' spoof','source':'https://www.washingtoncountyar.gov.attacker.test/'}
 call('agent/ingest',{'events':[bad]},bearer=token)
 rows,_=call('admin/events');spoof=next(x for x in rows['events'] if x['title']==bad['title']);assert any(i['field']=='source' for i in spoof['issues'])
 call('admin/event',{'id':spoof['id'],'revision':spoof['revision'],'action':'approve','confirmed':True,'event':spoof},400)
finally:
 call('admin/tokens',{'revoke':hashlib.sha256(token.encode()).hexdigest()});call('logout',{})
print(f'{checks} civic API checks passed; all synthetic data stayed local.')
