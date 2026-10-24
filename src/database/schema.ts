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

-- Categories table to support custom expenses/incomes categories, drag-and-drop ordering, and toggling active status
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT NOT NULL,              -- Category ID (e.g., 'food', 'custom_123')
  type        TEXT NOT NULL,              -- 'expense' | 'income'
  name        TEXT NOT NULL,              -- Display name
  icon        TEXT NOT NULL,              -- MaterialIcons name
  color       TEXT NOT NULL,              -- HEX primary color
  bg          TEXT NOT NULL,              -- HEX light-mode background tint
  is_active   INTEGER NOT NULL DEFAULT 1, -- 1 = active (shown in transaction grid), 0 = candidate (hidden)
  is_custom   INTEGER NOT NULL DEFAULT 0, -- 1 = user custom category, 0 = system built-in category
  sort_order  INTEGER NOT NULL DEFAULT 0, -- sorting weight (smaller goes first)
  created_at  INTEGER NOT NULL,           -- Creation millisecond timestamp
  PRIMARY KEY (id, type)
);

-- Indices to accelerate sorting and querying categories by type
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
`;
