"""Create private bootstrap SQL and crawl import outside the public repository."""
import json,hashlib,secrets,datetime,pathlib,sqlite3
root=pathlib.Path(__file__).resolve().parents[2]
private=root/'findout-private';private.mkdir(exist_ok=True,mode=0o700)
creds=private/'admin-login.json'
if creds.exists(): login=json.loads(creds.read_text())
else:
 login={'email':json.loads((root/'findout-production-settings.json').read_text())['administrator_email'],'password':secrets.token_urlsafe(32),'login_url':'https://findout.6mvbz5wv6c.workers.dev/admin'}
 creds.write_text(json.dumps(login,indent=2)+'\n');creds.chmod(0o600)
salt=secrets.token_hex(32);digest=hashlib.pbkdf2_hmac('sha256',login['password'].encode(),salt.encode(),100000).hex()
q=lambda x:'NULL' if x is None else "'"+str(x).replace("'","''")+"'"
now=datetime.datetime.now(datetime.timezone.utc).isoformat();stmts=[]
stmts.append('INSERT OR IGNORE INTO users VALUES('+','.join(map(q,['owner',login['email'],'admin',digest,salt,1,now]))+');')
report=json.loads((root/'findout-review/2026-q4/candidates.json').read_text())
ccc=[]
for day in [9,10,16,17,23,24,30,31]:
 ccc.append(dict(id=f'CCC-DATE-2026-10-{day}',title='Clay Date Night',date=f'2026-10-{day:02}',time='18:30',venue='Community Creative Center',address='505 W Spring St, Fayetteville, AR 72701',category='arts',price='$50 per person · ages 18+',description='A beginner pottery-wheel session for partners, friends or family. Materials and firing included. Registration required; check availability with the organizer.',source='https://communitycreativecenter.coursestorm.com/category/date-night'+('?page=2' if day>=30 else ''),evidenceSummary='Official CourseStorm catalog gives 2026 date, 6:30pm, $50 per person and age 18+. End time not verified for this occurrence.',score=90))
ccc.append(dict(id='CCC-GHOST-2026-10-09',title='Clay Ghost Workshop',date='2026-10-09',time='18:30',venue='Community Creative Center',address='505 W Spring St, Fayetteville, AR 72701',category='arts',price='Check organizer',description='A clay workshop with Laurie Massanelli. Check registration, price and age requirements with Community Creative Center.',source='https://communitycreativecenter.coursestorm.com/',evidenceSummary='Featured class explicitly lists October 9, 2026 at 6:30pm. Detail fetch failed; price and eligibility unconfirmed.',score=90))
for e in ccc:e.update(status='pending_review',fetchedOn='2026-10-05',timezone='America/Chicago')
(root/'findout-review/2026-q4/ccc-candidates.json').write_text(json.dumps(ccc,indent=2)+'\n')
all_events=list({e['id']:e for e in report['events']+ccc}.values())
for e in all_events:
 title=e['title'];date=e['date'];time=e.get('time') or '';venue=e['venue'];fp=hashlib.sha256('|'.join(v.strip().lower() for v in [title,date,time,venue]).encode()).hexdigest()
 values=[e['id'],title,date,time,e.get('endTime'),e.get('endDate'),venue,e.get('address') or '',e['category'],e.get('price') or 'Check organizer',e.get('description') or '',e['source'],e['evidenceSummary'],e.get('score'),'crawl',fp,now,now]
 stmts.append('INSERT OR IGNORE INTO events(id,title,date,time,end_time,end_date,venue,address,category,price,description,source,evidence,score,organizer_type,fingerprint,created_at,updated_at) VALUES('+','.join(map(q,values))+');')
for i,s in enumerate(report['sources']):
 if s['name']=='Community Creative Center':s.update(url='https://communitycreativecenter.coursestorm.com/',result='Separate CourseStorm catalog found. Imported 8 upcoming October date nights and Clay Ghost Workshop. Youth camp page has only spring/summer dates; no Q4 camps confirmed.')
 stmts.append('INSERT OR IGNORE INTO sources VALUES('+','.join(map(q,[f'source-{i}',s['name'],s['url'],1,s['result']]))+');')
stmts.append('INSERT OR IGNORE INTO crawl_runs VALUES('+','.join(map(q,['first-assisted-scan','assisted web scan','Oct–Dec 2026 around ZIP 72701; all candidates pending human review. CCC camps not confirmed for Q4.',len(all_events),now]))+');')
stmts.append('INSERT OR IGNORE INTO audit VALUES('+','.join(map(q,['initial-import','deployment','import_pending','first-assisted-scan','No events automatically approved.',now]))+');')
out=private/'bootstrap.sql';out.write_text('\n'.join(stmts)+'\n');out.chmod(0o600)
print(f'Prepared {len(all_events)} pending records. Private credentials saved outside repo: {creds}')
