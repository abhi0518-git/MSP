const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 4001;

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

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

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "catalog-service" });
});

app.get("/api/catalog/products", async (_, res) => {
  try {
    const result = await pool.query("SELECT id, name, price FROM products ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch products" });
  }
});

// Compatibility route for proxies that forward stripped path (/products).
app.get("/products", async (_, res) => {
  try {
    const result = await pool.query("SELECT id, name, price FROM products ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch products" });
  }
});

initSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`catalog-service listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("catalog-service startup failed", err);
    process.exit(1);
  });
