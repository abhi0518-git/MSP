const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const axios = require("axios");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 4002;
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:4001";

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

app.get("/api/orders", async (_, res) => {
  try {
    const result = await pool.query(
      "SELECT id, product_id, quantity, total_amount, created_at FROM orders ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch orders" });
  }
});

// Compatibility route for proxies that forward stripped path (/).
app.get("/", async (_, res) => {
  try {
    const result = await pool.query(
      "SELECT id, product_id, quantity, total_amount, created_at FROM orders ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { productId, quantity } = req.body || {};

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const productResponse = await axios.get(`${catalogServiceUrl}/api/catalog/products`);
    const product = productResponse.data.find((p) => p.id === Number(productId));

    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }

    const totalAmount = Number(product.price) * Number(quantity);

    const result = await pool.query(
      `
      INSERT INTO orders (product_id, quantity, total_amount)
      VALUES ($1, $2, $3)
      RETURNING id, product_id, quantity, total_amount, created_at
      `,
      [Number(productId), Number(quantity), totalAmount]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "failed to create order" });
  }
});

// Compatibility route for proxies that forward stripped path (/).
app.post("/", async (req, res) => {
  const { productId, quantity } = req.body || {};

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const productResponse = await axios.get(`${catalogServiceUrl}/api/catalog/products`);
    const product = productResponse.data.find((p) => p.id === Number(productId));

    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }

    const totalAmount = Number(product.price) * Number(quantity);

    const result = await pool.query(
      `
      INSERT INTO orders (product_id, quantity, total_amount)
      VALUES ($1, $2, $3)
      RETURNING id, product_id, quantity, total_amount, created_at
      `,
      [Number(productId), Number(quantity), totalAmount]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "failed to create order" });
  }
});

initSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`order-service listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("order-service startup failed", err);
    process.exit(1);
  });
