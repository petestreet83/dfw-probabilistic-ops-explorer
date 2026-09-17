PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS source_cache_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_system TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_timestamp TEXT,
  cache_timestamp TEXT NOT NULL,
  cache_mode TEXT NOT NULL,
  confidence REAL NOT NULL,
  license TEXT NOT NULL,
  payload_hash TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weather_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_icao TEXT NOT NULL,
  product_type TEXT NOT NULL,
  observation_time TEXT,
  raw_json TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_url TEXT NOT NULL,
  cache_timestamp TEXT NOT NULL,
  confidence REAL NOT NULL,
  UNIQUE (airport_icao, product_type, observation_time)
);

CREATE TABLE IF NOT EXISTS bts_flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_date TEXT NOT NULL,
  carrier TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('inbound','outbound')),
  dep_delay_minutes REAL,
  arr_delay_minutes REAL,
  carrier_delay_minutes REAL,
  weather_delay_minutes REAL,
  nas_delay_minutes REAL,
  late_aircraft_delay_minutes REAL,
  cancelled INTEGER NOT NULL DEFAULT 0,
  diverted INTEGER NOT NULL DEFAULT 0,
  source_system TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_timestamp TEXT,
  cache_timestamp TEXT NOT NULL,
  confidence REAL NOT NULL,
  license TEXT NOT NULL,
  UNIQUE (flight_date, carrier, flight_number, origin, destination)
);

CREATE TABLE IF NOT EXISTS source_status (
  source_name TEXT PRIMARY KEY,
  available INTEGER NOT NULL,
  mode TEXT NOT NULL,
  status_label TEXT NOT NULL,
  last_success_at TEXT,
  message TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_timestamp TEXT,
  cache_timestamp TEXT,
  confidence REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_airport_type_time ON weather_observations (airport_icao, product_type, observation_time DESC);
CREATE INDEX IF NOT EXISTS idx_bts_operation_date ON bts_flights (operation_type, flight_date DESC);
