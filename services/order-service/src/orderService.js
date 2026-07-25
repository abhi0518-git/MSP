const axios = require("axios");
const pool = require("./db");

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:4001";

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id VARCHAR(120) NOT NULL DEFAULT 'guest',
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(120) NOT NULL DEFAULT 'guest';");
}

async function listOrders(customerId) {
  if (customerId) {
    const result = await pool.query(
      "SELECT id, customer_id, product_id, quantity, total_amount, created_at FROM orders WHERE customer_id = $1 ORDER BY id DESC",
      [customerId]
    );
    return result.rows;
  }

  const result = await pool.query(
    "SELECT id, customer_id, product_id, quantity, total_amount, created_at FROM orders ORDER BY id DESC"
  );
  return result.rows;
}

async function createOrder({ productId, quantity, customerId }) {
  const productResponse = await axios.get(`${catalogServiceUrl}/api/catalog/products`);
  const product = productResponse.data.find((p) => p.id === Number(productId));

  if (!product) {
    const error = new Error("product not found");
    error.status = 404;
    throw error;
  }

  const totalAmount = Number(product.price) * Number(quantity);
  const result = await pool.query(
    `
    INSERT INTO orders (customer_id, product_id, quantity, total_amount)
    VALUES ($1, $2, $3, $4)
    RETURNING id, customer_id, product_id, quantity, total_amount, created_at
    `,
    [customerId || "guest", Number(productId), Number(quantity), totalAmount]
  );

  return result.rows[0];
}

module.exports = {
  initSchema,
  listOrders,
  createOrder
};
