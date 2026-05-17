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
  GET_PERIOD_SUMS: `
    SELECT type, SUM(amount) as total 
    FROM transactions 
    WHERE date >= ? AND date <= ? 
    GROUP BY type;
  `,
  GET_CATEGORY_RANKING: `
    SELECT category, SUM(amount) as total, COUNT(*) as count 
    FROM transactions 
    WHERE type = ? AND date >= ? AND date <= ? 
    GROUP BY category 
    ORDER BY total DESC;
  `,
  
  // Settings CRUD SQL
  UPSERT_SETTING: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
  GET_SETTING: 'SELECT value FROM settings WHERE key = ?;',
  DELETE_SETTING: 'DELETE FROM settings WHERE key = ?;',
  CLEAR_ALL_SETTINGS: 'DELETE FROM settings;'
};
