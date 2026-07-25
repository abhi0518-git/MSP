const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { initSchema, getProducts } = require("./catalogService");

const app = express();
const port = process.env.PORT || 4001;

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "catalog-service" });
});

app.get("/api/catalog/products", async (_, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch products" });
  }
});

// Compatibility route for proxies that forward stripped path (/products).
app.get("/products", async (_, res) => {
  try {
    const products = await getProducts();
    res.json(products);
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
