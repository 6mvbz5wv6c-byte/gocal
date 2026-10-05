"""Local integration tests. Never run against a public host."""
import json,urllib.request,urllib.error,pathlib,secrets,datetime
BASE='http://127.0.0.1:8794';cookie='';checks=0
login=json.loads((pathlib.Path(__file__).resolve().parents[2]/'findout-private/admin-login.json').read_text())
def call(path,payload=None,expected=200,origin=BASE,bearer=None):
 global checks
 h={'Origin':origin,'Cookie':cookie}
 if payload is not None:h['Content-Type']='application/json'
 if bearer:h['Authorization']='Bearer '+bearer
 req=urllib.request.Request(BASE+'/api/'+path,data=json.dumps(payload).encode() if payload is not None else None,headers=h)
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:r=e
 result=json.loads(r.read());assert r.status==expected,(path,r.status,result);checks+=1
 return result,r.headers
call('health');call('admin/events',expected=401);call('login',login,expected=403,origin='https://evil.example')
_,headers=call('login',login);cookie=headers['Set-Cookie'].split(';')[0];assert 'HttpOnly' in headers['Set-Cookie'] and 'Secure' in headers['Set-Cookie'] and 'SameSite=Strict' in headers['Set-Cookie']
call('session');existing,_=call('admin/events');assert len(existing['events'])>=37
stamp=secrets.token_hex(3);data={'title':'LOCAL TEST '+stamp,'date':'2026-11-09','time':'17:00','venue':'Test Venue','address':'1 Test St, Fayetteville, AR','category':'community','price':'Free','description':'Synthetic local integration fixture.','source':'https://example.org/','status':'approved','score':100}
call('events',data,201);public,_=call('events');assert not any(e['title']==data['title'] for e in public['events'])
queue,_=call('admin/events');event=next(e for e in queue['events'] if e['title']==data['title']);assert event['score'] is None
edit={'id':event['id'],'revision':event['revision'],'event':event,'action':'approve','confirmed':False}
call('admin/event',edit,400);edit['confirmed']=True;call('admin/event',edit);call('admin/event',edit,409)
public,_=call('events');record=next(e for e in public['events'] if e['id']==event['id']);assert 'evidence' not in record and 'reviewed_by' not in record
call('reports',{'eventId':event['id'],'reason':'incorrect','details':'Test report'})
t,_=call('admin/tokens',{'label':'Local test '+stamp});t=t['token'];saved_cookie=cookie;cookie=''
call('admin/events',expected=401,bearer=t)
agent=dict(data,title='AGENT TEST '+stamp)
call('agent/ingest',{'events':[agent],'summary':'local test'},bearer=t)
r,_=call('agent/ingest',{'events':[agent],'summary':'duplicate local test'},bearer=t);assert r['inserted']==0
call('events',dict(data,title='Bad URL',source='javascript:alert(1)'),400)
cookie=saved_cookie;tokens,_=call('admin/tokens');th=next(x['hash'] for x in tokens['tokens'] if x['label']=='Local test '+stamp)
call('admin/tokens',{'revoke':th});call('agent/sources',expected=401,bearer=t)
moderator={'email':stamp+'@example.org','password':secrets.token_urlsafe(24)}
call('admin/users',moderator)
_,headers=call('login',moderator);cookie=headers['Set-Cookie'].split(';')[0]
call('admin/events');call('admin/users',expected=403);call('admin/tokens',{'label':'forbidden'},403)
cookie=saved_cookie
call('admin/export');call('admin/reports');call('admin/sources');call('admin/runs');call('admin/audit')
call('logout',{});call('admin/events',expected=401)
print(f'{checks} backend checks passed: auth, CSRF, pending-only submissions/agent ingestion, explicit approval, conflict detection, reporting, export, revocation and logout.')
