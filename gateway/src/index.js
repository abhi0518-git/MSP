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

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "gateway" });
});

app.get("/api/catalog/products", async (_, res) => {
  try {
    const response = await axios.get(`${catalogServiceUrl}/api/catalog/products`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const payload = error.response?.data || { error: "catalog service unavailable" };
    res.status(status).json(payload);
  }
});

app.get("/api/orders", async (_, res) => {
  try {
    const response = await axios.get(`${orderServiceUrl}/api/orders`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const payload = error.response?.data || { error: "order service unavailable" };
    res.status(status).json(payload);
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const response = await axios.post(`${orderServiceUrl}/api/orders`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const payload = error.response?.data || { error: "order service unavailable" };
    res.status(status).json(payload);
  }
});

app.listen(port, () => {
  console.log(`gateway listening on port ${port}`);
});
