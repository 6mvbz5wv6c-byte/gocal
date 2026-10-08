"""Bounded public-source capture for the local crawler; no login, JS or model execution."""
import argparse, datetime, hashlib, ipaddress, json, pathlib, socket, subprocess, time
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin, urldefrag
from urllib.robotparser import RobotFileParser

AGENT = 'FindOutBot/1.0 (+https://findout.events)'
MAX_BYTES = 2_000_000


def check_url(url, hosts):
    u = urlparse(url)
    if u.scheme != 'https' or u.username or u.password or u.port not in (None, 443) or u.hostname not in hosts:
        raise ValueError('Source or redirect outside explicit HTTPS host scope')
    addresses = {r[4][0] for r in socket.getaddrinfo(u.hostname, 443, type=socket.SOCK_STREAM)}
    if not addresses or any(not ipaddress.ip_address(a).is_global for a in addresses):
        raise ValueError('Non-public destination refused')
    return u, sorted(addresses)[0]


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.links, self.documents, self.headings = [], [], [], []
        self.skip, self.script, self.ld, self.heading = 0, '', False, None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'script': self.skip += 1; self.ld = a.get('type','').lower() == 'application/ld+json'; self.script = ''; return
        if tag in ('style','noscript','svg'): self.skip += 1
        if self.skip: return
        if tag in ('p','div','section','article','li','br','h1','h2','h3','tr','dt','dd'): self.parts.append('\n')
        if tag in ('h1','h2','h3'): self.heading = [tag, '']
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
    def handle_endtag(self, tag):
        if tag == 'script':
            if self.ld:
                try: self.documents.append(json.loads(self.script))
                except (ValueError, RecursionError): pass
            self.ld = False; self.skip = max(0, self.skip-1); return
        if tag in ('style','noscript','svg'): self.skip = max(0, self.skip-1)
        if self.skip: return
        if self.heading and tag == self.heading[0]: self.headings.append(self.heading); self.heading = None
        if tag in ('p','div','section','article','li','h1','h2','h3','tr','dt','dd'): self.parts.append('\n')
    def handle_data(self, data):
        if self.ld: self.script += data
        if self.skip: return
        self.parts.append(data)
        if self.heading: self.heading[1] += data
    def result(self):
        return {'text':'\n'.join(' '.join(s.split()) for s in ''.join(self.parts).splitlines() if s.strip()), 'links':list(dict.fromkeys(self.links)), 'documents':self.documents, 'headings':self.headings}


class Fetcher:
    def __init__(self, hosts, delay=1): self.hosts, self.delay, self.robots, self.last = set(hosts), delay, {}, {}
    def request(self, url):
        u, addr = check_url(url, self.hosts)
        time.sleep(max(0, self.last.get(u.hostname,0)+self.delay-time.monotonic()))
        self.last[u.hostname] = time.monotonic()
        # Pin the validated address to avoid a second DNS resolution/rebinding.
        address = '['+addr+']' if ':' in addr else addr
        p = subprocess.run(['curl','--silent','--show-error','--noproxy','*','--proto','=https','--connect-timeout','8','--max-time','20','--max-filesize',str(MAX_BYTES), '--resolve',f'{u.hostname}:443:{address}', '-A',AGENT,'-H','Accept-Encoding: identity','-D','-','--',url],capture_output=True)
        if p.returncode: raise ValueError('Fetch failed or exceeded timeout/byte budget')
        headers, sep, body = p.stdout.partition(b'\r\n\r\n')
        if not sep or len(body)>MAX_BYTES: raise ValueError('Invalid or oversized response')
        lines=headers.decode('iso-8859-1').splitlines(); code=int(lines[0].split()[1]); h={k.strip().lower():v.strip() for line in lines[1:] if ':' in line for k,v in [line.split(':',1)]}
        return code,h,body.decode('utf-8',errors='replace')
    def allowed(self, url):
        u=urlparse(url); root='https://'+u.netloc
        if root not in self.robots:
            code,h,body=self.request(root+'/robots.txt')
            rp=RobotFileParser()
            if code==404: rp.parse([])
            elif code==200: rp.parse(body.splitlines())
            else: raise ValueError('Robots policy unavailable; defer this host')
            self.robots[root]=rp
        rp=self.robots[root]
        self.delay=max(self.delay,rp.crawl_delay(AGENT) or 0)
        if not rp.can_fetch(AGENT,url): raise ValueError('Robots policy disallows this page')
    def capture(self, url):
        original=url
        try:
            for _ in range(4):
                check_url(url,self.hosts);self.allowed(url);code,h,body=self.request(url)
                if code in (301,302,303,307,308): url=urldefrag(urljoin(url,h.get('location','')))[0];continue
                if code!=200: return {'url':original,'finalUrl':url,'status':'blocked' if code in (401,403,429) else 'error','httpStatus':code}
                if 'text/html' not in h.get('content-type',''): raise ValueError('Unsupported content type; use a dedicated parser')
                page=Page();page.feed(body);result=page.result()
                return {'url':original,'finalUrl':url,'status':'ok','httpStatus':code,'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'contentHash':hashlib.sha256(body.encode()).hexdigest(),**result}
            raise ValueError('Redirect budget exceeded')
        except Exception as e: return {'url':original,'status':'error','error':str(e)[:300]}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('input',help='JSON events or list of URLs');p.add_argument('output');p.add_argument('--max-pages',type=int,default=150);a=p.parse_args()
    data=json.loads(pathlib.Path(a.input).read_text());urls=list(dict.fromkeys(e if isinstance(e,str) else e['source'] for e in data))
    if len(urls)>a.max_pages: p.error('Page budget exceeded')
    fetcher=Fetcher({urlparse(u).hostname for u in urls});out=pathlib.Path(a.output);results=[]
    for i,url in enumerate(urls):
        result=fetcher.capture(url);results.append(result);out.write_text(json.dumps(results));out.chmod(0o600)
        print(i+1,len(urls),result['status'],url,flush=True)
