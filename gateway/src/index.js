const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 8080;
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:4001";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:4002";

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "gateway" });
});

app.use(
  "/api/catalog",
  createProxyMiddleware({
    target: catalogServiceUrl,
    changeOrigin: true,
    pathRewrite: (path) => `/api/catalog${path}`
  })
);

app.use(
  "/api/orders",
  createProxyMiddleware({
    target: orderServiceUrl,
    changeOrigin: true,
    pathRewrite: (path) => `/api/orders${path}`
  })
);

app.listen(port, () => {
  console.log(`gateway listening on port ${port}`);
});
