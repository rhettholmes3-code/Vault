export const CREATE_TABLES_SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,           -- UUID (generated via expo-crypto)
  type        TEXT NOT NULL,              -- 'expense' | 'income'
  amount      REAL NOT NULL,              -- Double amount value
  category    TEXT NOT NULL,              -- Category ID (e.g., 'food', 'salary')
  date        TEXT NOT NULL,              -- ISO 8601 date string (YYYY-MM-DD)
  note        TEXT DEFAULT '',            -- Optional custom text notes
  created_at  INTEGER NOT NULL,           -- Millisecond epoch creation timestamp
  updated_at  INTEGER NOT NULL            -- Millisecond epoch update timestamp
);

-- Indices to accelerate statistical calculations on date ranges and types
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Persistent settings table representing key-value pairs (replaces web localStorage)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;
