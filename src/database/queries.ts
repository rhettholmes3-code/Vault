export const QUERIES = {
  // Core Transactions CRUD SQL
  INSERT_TRANSACTION: 'INSERT INTO transactions (id, type, amount, category, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
  UPDATE_TRANSACTION: 'UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, note = ?, updated_at = ? WHERE id = ?;',
  DELETE_TRANSACTION: 'DELETE FROM transactions WHERE id = ?;',
  GET_TRANSACTION_BY_ID: 'SELECT * FROM transactions WHERE id = ?;',
  GET_ALL_TRANSACTIONS: 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC;',
  GET_TRANSACTIONS_BY_RANGE: 'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC;',
  CLEAR_ALL_TRANSACTIONS: 'DELETE FROM transactions;',
  
  // Custom Analytical Queries
  GET_PERIOD_SUMS: 'SELECT type, SUM(amount) as total FROM transactions WHERE date >= ? AND date <= ? GROUP BY type;',
  GET_CATEGORY_RANKING: 'SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ? GROUP BY category ORDER BY total DESC;',
  
  // Settings CRUD SQL
  UPSERT_SETTING: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
  GET_SETTING: 'SELECT value FROM settings WHERE key = ?;',
  DELETE_SETTING: 'DELETE FROM settings WHERE key = ?;',
  CLEAR_ALL_SETTINGS: 'DELETE FROM settings;',

  // Categories CRUD SQL
  GET_CATEGORIES_BY_TYPE: 'SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC;',
  GET_ACTIVE_CATEGORIES: 'SELECT * FROM categories WHERE type = ? AND is_active = 1 ORDER BY sort_order ASC;',
  UPSERT_CATEGORY: 'INSERT INTO categories (id, type, name, icon, color, bg, is_active, is_custom, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id, type) DO UPDATE SET name = excluded.name, icon = excluded.icon, color = excluded.color, bg = excluded.bg, is_active = excluded.is_active, sort_order = excluded.sort_order;',
  DELETE_CATEGORY: 'DELETE FROM categories WHERE id = ? AND type = ? AND is_custom = 1;',
  UPDATE_CATEGORY_ORDER: 'UPDATE categories SET sort_order = ? WHERE id = ? AND type = ?;',
  UPDATE_CATEGORY_ACTIVE: 'UPDATE categories SET is_active = ? WHERE id = ? AND type = ?;',
  GET_CATEGORY_BY_ID: 'SELECT * FROM categories WHERE id = ? AND type = ?;',
  CLEAR_ALL_CATEGORIES: 'DELETE FROM categories;'
};
