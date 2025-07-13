let pool;

export function init(connectionString) {
  if (!pool) {
    pool = createPool({ connectionString });
  }
}

export function query(queryText, params = []) {
  if (!pool) {
    throw new Error("Database not initialized. Call init(connectionString) first.");
  }
  return pool.query(queryText, params);
}