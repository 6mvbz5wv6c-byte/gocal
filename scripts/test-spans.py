"""Local-only end-to-end tests for multi-day event storage and approval."""
import json,urllib.request,urllib.error,pathlib,secrets
BASE='http://127.0.0.1:8794';cookie='';checks=0
login=json.loads((pathlib.Path(__file__).resolve().parents[2]/'findout-private/admin-login.json').read_text())
def call(path,payload=None,status=200):
 global checks
 headers={'Origin':BASE,'Cookie':cookie,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.'+str(100+checks)}
 req=urllib.request.Request(BASE+'/api/'+path,data=None if payload is None else json.dumps(payload).encode(),headers=headers)
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:r=e
 data=json.loads(r.read());assert r.status==status,(path,r.status,data);checks+=1;return data,r.headers
_,h=call('login',login);cookie=h['Set-Cookie'].split(';')[0]
base={'title':'LOCAL SPAN '+secrets.token_hex(4),'category':'community','date':'2026-10-30','endDate':'2026-11-05','time':'10:00','endTime':'17:00','recurrence':'range','venue':'Test Venue','address':'1 Test St, Fayetteville AR','description':'Local test only','source':'https://example.org/festival','organizerName':'Test','organizerUrl':'https://example.org','scheduleNote':'10am–5pm daily'}
for patch in [{},{'allDay':True,'time':'','endTime':'','title':base['title']+' all day'}]:
 event={**base,**patch};call('events',event,201);rows,_=call('admin/events');e=next(x for x in rows['events'] if x['title']==event['title']);assert e['issues']==[]
 call('admin/event',{'id':e['id'],'revision':e['revision'],'action':'approve','confirmed':True,'event':e});public,_=call('events');found=[x for x in public['events'] if x['id']==e['id']];assert len(found)==1;assert found[0]['endDate']=='2026-11-05';assert found[0]['allDay']==patch.get('allDay',False);assert found[0]['scheduleNote']==base['scheduleNote']
 hist,_=call('admin/evidence?id='+e['id']);assert hist['history'][0]['to_status']=='approved'
call('events',{**base,'allDay':True},400)
call('events',{**base,'endDate':'2026-10-01'},400)
call('events',{**base,'allDay':'true'},400)
call('logout',{});print(f'{checks} multi-day API checks passed; synthetic fixtures stayed local.')
