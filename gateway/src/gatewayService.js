const axios = require("axios");

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:4001";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:4002";
const http = axios.create({ timeout: 8000 });

function mapUpstreamError(error, fallbackMessage) {
  return {
    status: error.response?.status || 502,
    payload: error.response?.data || { error: fallbackMessage }
  };
}

async function fetchProducts() {
  const response = await http.get(`${catalogServiceUrl}/api/catalog/products`);
  return response.data;
}

async function fetchOrders(customerId) {
  const response = await http.get(`${orderServiceUrl}/api/orders`, {
    params: customerId ? { customerId } : undefined
  });
  return response.data;
}

async function createOrder(orderInput) {
  const response = await http.post(`${orderServiceUrl}/api/orders`, orderInput);
  return { status: response.status, data: response.data };
}

module.exports = {
  mapUpstreamError,
  fetchProducts,
  fetchOrders,
  createOrder
};
