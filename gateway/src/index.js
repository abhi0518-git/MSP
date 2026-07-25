const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const {
  mapUpstreamError,
  fetchProducts,
  fetchOrders,
  createOrder
} = require("./gatewayService");

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "gateway" });
});

app.get("/api/products", async (_, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    const { status, payload } = mapUpstreamError(error, "catalog service unavailable");
    res.status(status).json(payload);
  }
});

// Backward-compatible endpoint for existing UI calls.
app.get("/api/catalog/products", async (req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    const { status, payload } = mapUpstreamError(error, "catalog service unavailable");
    res.status(status).json(payload);
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await fetchOrders(req.query.customerId);
    res.json(orders);
  } catch (error) {
    const { status, payload } = mapUpstreamError(error, "order service unavailable");
    res.status(status).json(payload);
  }
});

app.post("/api/orders", async (req, res) => {
  const { productId, quantity, customerId } = req.body || {};
  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const response = await createOrder({
      productId: Number(productId),
      quantity: Number(quantity),
      customerId: customerId || "guest"
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const { status, payload } = mapUpstreamError(error, "order service unavailable");
    res.status(status).json(payload);
  }
});

app.listen(port, () => {
  console.log(`gateway listening on port ${port}`);
});
