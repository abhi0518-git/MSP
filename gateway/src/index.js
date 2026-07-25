const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 8080;
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:4001";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:4002";

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

const http = axios.create({ timeout: 8000 });

function upstreamError(error, fallbackMessage) {
  const status = error.response?.status || 502;
  const payload = error.response?.data || { error: fallbackMessage };
  return { status, payload };
}

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "gateway" });
});

app.get("/api/products", async (_, res) => {
  try {
    const response = await http.get(`${catalogServiceUrl}/api/catalog/products`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const { status, payload } = upstreamError(error, "catalog service unavailable");
    res.status(status).json(payload);
  }
});

// Backward-compatible endpoint for existing UI calls.
app.get("/api/catalog/products", async (req, res) => {
  try {
    const response = await http.get(`${catalogServiceUrl}/api/catalog/products`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const { status, payload } = upstreamError(error, "catalog service unavailable");
    res.status(status).json(payload);
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const customerId = req.query.customerId;
    const response = await http.get(`${orderServiceUrl}/api/orders`, {
      params: customerId ? { customerId } : undefined
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const { status, payload } = upstreamError(error, "order service unavailable");
    res.status(status).json(payload);
  }
});

app.post("/api/orders", async (req, res) => {
  const { productId, quantity, customerId } = req.body || {};
  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ error: "productId and quantity are required" });
  }

  try {
    const response = await http.post(`${orderServiceUrl}/api/orders`, {
      productId: Number(productId),
      quantity: Number(quantity),
      customerId: customerId || "guest"
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const { status, payload } = upstreamError(error, "order service unavailable");
    res.status(status).json(payload);
  }
});

app.listen(port, () => {
  console.log(`gateway listening on port ${port}`);
});
