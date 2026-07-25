const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { initSchema, listOrders, createOrder } = require("./orderService");

const app = express();
const port = process.env.PORT || 4002;

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await listOrders(req.query.customerId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch orders" });
  }
});

// Compatibility route for proxies that forward stripped path (/).
app.get("/", async (_, res) => {
  try {
    const orders = await listOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { productId, quantity, customerId } = req.body || {};

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const order = await createOrder({ productId, quantity, customerId });
    return res.status(201).json(order);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "failed to create order" });
  }
});

// Compatibility route for proxies that forward stripped path (/).
app.post("/", async (req, res) => {
  const { productId, quantity, customerId } = req.body || {};

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const order = await createOrder({ productId, quantity, customerId });
    return res.status(201).json(order);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "failed to create order" });
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
