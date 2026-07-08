-- Setup script untuk Neon PostgreSQL
-- Jalankan script ini di Neon SQL editor untuk create table tracking

CREATE TABLE IF NOT EXISTS tracking (
  id TEXT PRIMARY KEY,
  nomor_target TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  city TEXT,
  province TEXT,
  country TEXT,
  status_link TEXT DEFAULT 'active' CHECK (status_link IN ('active', 'opened', 'expired')),
  status_lokasi TEXT DEFAULT 'pending' CHECK (status_lokasi IN ('pending', 'gagal', 'Lokasi Didapatkan')),
  password_hash TEXT,
  password_plain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expired_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  CONSTRAINT positive_coords CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND
     latitude >= -90 AND latitude <= 90 AND
     longitude >= -180 AND longitude <= 180)
  )
);

-- Create indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_tracking_created_at ON tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_status_link ON tracking(status_link);
CREATE INDEX IF NOT EXISTS idx_tracking_status_lokasi ON tracking(status_lokasi);

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tracking'
ORDER BY ordinal_position;
