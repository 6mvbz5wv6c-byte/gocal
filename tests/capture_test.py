import importlib.util,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('capture','crawler/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CaptureTests(unittest.TestCase):
 def test_parser(self):
  p=c.Page();p.feed('<h1>Band &amp; Friends</h1><script type="application/ld+json">{"@type":"Event","name":"Band"}</script><script>publish()</script><p>6pm</p><p>Doors 5pm</p><a href="/show">Show</a>');r=p.result();self.assertIn('Band & Friends',r['text']);self.assertNotIn('publish()',r['text']);self.assertEqual(r['documents'][0]['name'],'Band');self.assertIn('6pm\nDoors 5pm',r['text']);self.assertEqual(r['links'],['/show'])
 def test_private_and_redirect_destinations(self):
  for ip in ['127.0.0.1','10.0.0.1','169.254.169.254','::1','::ffff:127.0.0.1']:
   with patch.object(c.socket,'getaddrinfo',return_value=[(None,None,None,None,(ip,443))]):
    with self.assertRaises(ValueError):c.check_url('https://example.org/event',{'example.org'})
  for url in ['http://example.org/','https://user:pass@example.org/','https://example.org:8443/','https://other.example/']:
   with self.assertRaises(ValueError):c.check_url(url,{'example.org'})
 def test_robots_fail_closed(self):
  f=c.Fetcher({'example.org'})
  with patch.object(f,'request',return_value=(403,{},'')):
   with self.assertRaises(ValueError):f.allowed('https://example.org/')
  with patch.object(f,'request',return_value=(200,{},'User-agent: *\nDisallow: /private')):
   with self.assertRaises(ValueError):f.allowed('https://example.org/private/event')
 def test_capture_does_not_execute_or_follow_external_links(self):
  f=c.Fetcher({'example.org'});html='<h1>Public Event</h1><a href="https://private.example/">Fetch me</a>'
  with patch.object(c,'check_url',return_value=(None,None)),patch.object(f,'allowed'),patch.object(f,'request',return_value=(200,{'content-type':'text/html'},html)) as request:
   r=f.capture('https://example.org/');self.assertEqual(r['status'],'ok');self.assertEqual(request.call_count,1)
if __name__=='__main__':unittest.main()
