CREATE TABLE IF NOT EXISTS certificates (
  cert_id   VARCHAR(64) PRIMARY KEY,
  user_id   VARCHAR(128) NOT NULL,
  course_id VARCHAR(128) NOT NULL,
  tier      VARCHAR(16)  NOT NULL CHECK (tier IN ('basic','silver','gold')),
  hash      VARCHAR(128) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_user ON certificates(user_id); 