INSERT INTO categories(id,label) VALUES('civics','Civics');
ALTER TABLE events ADD COLUMN civic_notice TEXT NOT NULL DEFAULT '' CHECK(civic_notice IN ('','early-voting','election-day'));
ALTER TABLE events ADD COLUMN location_url TEXT NOT NULL DEFAULT '';
CREATE TABLE event_sessions (
 event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 date TEXT NOT NULL,
 start_time TEXT NOT NULL CHECK(start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND start_time<'24:00'),
 end_time TEXT NOT NULL CHECK(end_time GLOB '[0-2][0-9]:[0-5][0-9]' AND end_time<'24:00' AND end_time>start_time),
 PRIMARY KEY(event_id,date)
);
