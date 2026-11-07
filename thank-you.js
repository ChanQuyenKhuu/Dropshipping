const LAST_DEMO_ORDER_STORAGE_KEY = "morrow-last-demo-order";

function formatOrderPrice(price) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function loadDemoOrder() {
  try {
    const order = JSON.parse(sessionStorage.getItem(LAST_DEMO_ORDER_STORAGE_KEY) || "null");
    if (!order || typeof order !== "object" || !Array.isArray(order.items) || order.items.length === 0) return null;

    const validItems = order.items.filter((item) =>
      item && typeof item.name === "string" && Number.isInteger(item.quantity) && item.quantity > 0 &&
      Number.isFinite(item.price) && item.price >= 0
    );
    if (validItems.length !== order.items.length) return null;

    return {
      number: typeof order.number === "string" ? order.number : "",
      items: validItems,
      subtotal: Number.isFinite(order.subtotal) ? order.subtotal : 0,
      promoCode: typeof order.promoCode === "string" ? order.promoCode : "",
      discount: Number.isFinite(order.discount) && order.discount >= 0 ? order.discount : 0,
      shipping: Number.isFinite(order.shipping) ? order.shipping : 0,
      total: Number.isFinite(order.total) ? order.total : 0
    };
  } catch (error) {
    console.error("Could not load the demo order confirmation.", error);
    return null;
  }
}

const demoOrder = loadDemoOrder();

if (demoOrder) {
  document.querySelector("#order-confirmation-message").textContent =
    "Your order is confirmed. We hope your new finds make the everyday a little better.";
  document.querySelector("#order-confirmation-number").textContent = `Demo order ${demoOrder.number}`;
  document.querySelector("#order-confirmation-items").innerHTML = demoOrder.items.map((item) => `
    <div class="order-confirmation-item">
      <span>${item.name} <span class="order-confirmation-quantity">× ${item.quantity}</span></span>
      <strong>${formatOrderPrice(item.price * item.quantity)}</strong>
    </div>
  `).join("");
  document.querySelector("#order-subtotal").textContent = formatOrderPrice(demoOrder.subtotal);
  if (demoOrder.discount > 0) {
    document.querySelector("#order-discount-row").hidden = false;
    document.querySelector("#order-discount").textContent = `−${formatOrderPrice(demoOrder.discount)}`;
  }
  document.querySelector("#order-shipping").textContent = demoOrder.shipping === 0
    ? "Free"
    : formatOrderPrice(demoOrder.shipping);
  document.querySelector("#order-total").textContent = formatOrderPrice(demoOrder.total);
} else {
  document.querySelector("#confirmation-title").textContent = "No recent order found.";
  document.querySelector("#order-confirmation-message").textContent =
    "Place a demo order at checkout and your confirmation will appear here.";
  document.querySelector(".order-confirmation-number").hidden = true;
  document.querySelector(".order-confirmation-items").hidden = true;
  document.querySelector(".order-confirmation-total").hidden = true;
  document.querySelector(".order-confirmation-demo").hidden = true;
}
