const pool = require("./db");

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      price NUMERIC(10,2) NOT NULL
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO products (name, price)
      VALUES
        ('Keyboard', 49.99),
        ('Mouse', 19.99),
        ('Monitor', 199.99)
    `);
  }
}

async function getProducts() {
  const result = await pool.query("SELECT id, name, price FROM products ORDER BY id");
  return result.rows;
}

module.exports = {
  initSchema,
  getProducts
};
