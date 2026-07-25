const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, "public")));

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
