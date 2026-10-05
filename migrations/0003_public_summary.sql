ALTER TABLE events ADD COLUMN source_summary TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS decisions_created ON moderation_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_target_created ON audit(target,created_at DESC);
