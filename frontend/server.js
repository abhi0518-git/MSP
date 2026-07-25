const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;
const gatewayUrl = process.env.GATEWAY_URL || "http://gateway:8080";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, "public")));

// Path-based routing: browser calls /api/* on frontend host, frontend proxies to gateway.
app.use(
  "/api",
  createProxyMiddleware({
    target: gatewayUrl,
    changeOrigin: true
  })
);

app.get("/config.js", (_, res) => {
  const apiBaseUrl = process.env.API_BASE_URL || "";
  res.type("application/javascript");
  res.send(`window.__APP_CONFIG__ = { API_BASE_URL: "${apiBaseUrl}" };`);
});

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "frontend" });
});

app.listen(port, () => {
  console.log(`frontend listening on port ${port}`);
});
