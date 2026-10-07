"""Isolated, in-memory migration/ledger tests. No credentials or network."""
import pathlib,sqlite3,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class SchemaTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:');self.db.executescript((ROOT/'migrations/0001_production.sql').read_text());self.db.execute("INSERT INTO users VALUES('u','test@example.org','admin','hash','salt',1,'2026-10-05T00:00:00Z')")
  for n in ['e1','e2']:
   self.db.execute("INSERT INTO events(id,title,date,venue,address,category,created_at,updated_at) VALUES(?,?,?,'Gallery','123 Test St','arts','2026-10-05T00:00:00Z','2026-10-05T00:00:00Z')",(n,n,'2026-10-09'))
  self.db.executescript((ROOT/'migrations/0002_review_ledger.sql').read_text());self.db.executescript((ROOT/'migrations/0003_public_summary.sql').read_text());self.db.executescript((ROOT/'migrations/0004_event_spans.sql').read_text());self.db.executescript((ROOT/'migrations/0005_civic_sessions.sql').read_text())
 def test_migration_preserves_candidates_and_normalizes_shared_venue(self):
  self.assertEqual(self.db.execute('SELECT COUNT(*) FROM events').fetchone()[0],2);self.assertEqual(self.db.execute('SELECT COUNT(*) FROM venues').fetchone()[0],1);self.assertEqual(self.db.execute('SELECT COUNT(*) FROM event_occurrences').fetchone()[0],2);self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(),[])
 def test_event_span_defaults_and_boolean_constraint(self):
  self.assertEqual(self.db.execute('SELECT all_day,schedule_note FROM events LIMIT 1').fetchone(),(0,''))
  self.db.execute("UPDATE events SET all_day=1,end_date='2026-10-15',schedule_note='Festival week' WHERE id='e1'")
  self.assertEqual(self.db.execute('SELECT COUNT(*) FROM events').fetchone()[0],2)
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute('UPDATE events SET all_day=2')
 def test_civic_sessions_are_referential_and_one_per_day(self):
  self.db.execute("INSERT INTO event_categories VALUES('e1','civics')")
  self.db.execute("INSERT INTO event_sessions VALUES('e1','2026-10-19','08:00','18:00')")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO event_sessions VALUES('missing','2026-10-19','08:00','18:00')")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO event_sessions VALUES('e1','2026-10-19','09:00','18:00')")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO event_sessions VALUES('e1','2026-10-20','18:00','08:00')")
  self.assertEqual(self.db.execute("SELECT civic_notice,location_url FROM events WHERE id='e1'").fetchone(),('',''))
 def test_unknowns_are_null_in_occurrences(self):self.assertEqual(self.db.execute('SELECT start_time,end_time FROM event_occurrences LIMIT 1').fetchone(),(None,None))
 def test_foreign_keys_and_taxonomy_reject_orphans(self):
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO event_categories VALUES('missing','arts')")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO event_categories VALUES('e1','invented')")
 def test_append_only_decisions_and_revision_uniqueness(self):
  row=('d','e1','u','approve','pending','approved',1,2,'reviewed','{}','{}','2026-10-05T00:00:00Z');self.db.execute('INSERT INTO moderation_decisions VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',row)
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE moderation_decisions SET reason='rewritten'")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute('DELETE FROM moderation_decisions')
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute('INSERT INTO moderation_decisions VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('d2',*row[1:]))
 def test_analytics_reference_category_ids(self):self.assertEqual(self.db.execute('SELECT category_id,event_count FROM analytics_category_status').fetchall(),[('arts',2)])
if __name__=='__main__':unittest.main()
