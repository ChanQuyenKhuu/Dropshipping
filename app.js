const products = [
  { id: "daily-bottle", name: "Daylight Bottle", category: "Travel", description: "Your new everywhere bottle", price: 28, badge: "Bestseller", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80" },
  { id: "soft-glow-lamp", name: "Soft Glow Lamp", category: "Home", description: "A softer kind of light", price: 42, badge: "Good light", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80" },
  { id: "weekend-tote", name: "Weekender Tote", category: "Travel", description: "Room for the little extras", price: 34, badge: "Easy favorite", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80" },
  { id: "little-speaker", name: "Pocket Speaker", category: "Everyday", description: "Bring a little soundtrack", price: 46, badge: "New find", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80" },
  { id: "cloud-mug", name: "Cloud Nine Mug", category: "Home", description: "A slower morning, maybe", price: 22, badge: "Small joy", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80" },
  { id: "daily-sling", name: "Daily Sling Bag", category: "Everyday", description: "Hands-free, all day", price: 39, badge: "Bestseller", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80" },
  { id: "sunny-sunnies", name: "Sunday Sunglasses", category: "Travel", description: "A little shade goes far", price: 26, badge: "Sunny days", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80" },
  { id: "slow-sunday-candle", name: "Slow Sunday Candle", category: "Home", description: "Citrus, cedar, take a breath", price: 24, badge: "Made for winding down", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80" }
];

const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING_RATE = 4.95;
const PURCHASED_PRODUCTS_STORAGE_KEY = "morrow-purchased-products";
const PRODUCT_PURCHASE_COUNTS_STORAGE_KEY = "morrow-product-purchase-counts";
const LAST_DEMO_ORDER_STORAGE_KEY = "morrow-last-demo-order";
const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const emptyState = document.querySelector("#empty-state");
const cartDrawer = document.querySelector("#cart-drawer");
const overlay = document.querySelector("#overlay");
const cartItems = document.querySelector("#cart-items");
const toast = document.querySelector("#toast");
let activeCategory = "All";
let toastTimeout;
let cart = loadCart();

function loadCart() {
  try {
    const cartFromUrl = new URLSearchParams(window.location.search).get("cart");
    const savedCart = JSON.parse(cartFromUrl || localStorage.getItem("morrow-cart") || "{}");
    return Object.fromEntries(Object.entries(savedCart).filter(([id, quantity]) => products.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0));
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("morrow-cart", JSON.stringify(cart));
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  let visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (sortSelect.value === "price-low") visibleProducts = [...visibleProducts].sort((a, b) => a.price - b.price);
  if (sortSelect.value === "price-high") visibleProducts = [...visibleProducts].sort((a, b) => b.price - a.price);

  productGrid.innerHTML = visibleProducts.map((product, index) => `
    <article class="product-card" style="animation-delay:${index * 45}ms">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
        <span class="product-badge">${product.badge}</span>
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
        </button>
      </div>
      <div class="product-info">
        <div><h3 class="product-name">${product.name}</h3><p class="product-description">${product.description}</p></div>
        <span class="product-price">${formatPrice(product.price)}</span>
      </div>
      <div class="product-rating" data-product-rating="${product.id}">
        <div class="rating-stars" role="group" aria-label="Rate ${product.name}"></div>
        <span class="rating-label" aria-live="polite"></span>
      </div>
    </article>
  `).join("");
  emptyState.hidden = visibleProducts.length > 0;
}

function cartQuantity() {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function cartSubtotal() {
  return products.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0);
}

function renderCart() {
  const count = cartQuantity();
  const subtotal = cartSubtotal();
  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#drawer-count").textContent = `(${count})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);

  const shippingNote = document.querySelector("#shipping-note");
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingNote.innerHTML = `You've unlocked free shipping. Nice one!<div class="shipping-track"><span style="width:100%"></span></div>`;
  } else {
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
    shippingNote.innerHTML = `You're ${formatPrice(remaining)} away from free shipping.<div class="shipping-track"><span style="width:${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%"></span></div>`;
  }

  const items = products.filter((product) => cart[product.id]);
  cartItems.innerHTML = items.length ? items.map((product) => `
    <div class="cart-item">
      <img src="${product.image}" alt="" />
      <div class="cart-item-copy"><strong>${product.name}</strong><span>${formatPrice(product.price)}</span>
        <div class="quantity-control" aria-label="Quantity for ${product.name}">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${product.name}">−</button>
          <span>${cart[product.id]}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Add one ${product.name}">+</button>
        </div>
      </div>
      <span class="cart-item-price">${formatPrice(product.price * cart[product.id])}</span>
    </div>
  `).join("") : '<p class="cart-empty">Your bag is having a quiet moment.<br />Add something lovely to get started.</p>';
  document.querySelector("#checkout-button").disabled = count === 0;
}

function renderCheckout() {
  const items = products.filter((product) => cart[product.id]);
  const subtotal = cartSubtotal();
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE;
  document.querySelector("#checkout-cart-count").textContent = cartQuantity();
  document.querySelector("#checkout-count").textContent = `(${cartQuantity()} ${cartQuantity() === 1 ? "item" : "items"})`;
  document.querySelector("#checkout-form button[type='submit']").disabled = cartQuantity() === 0;
  document.querySelector("#checkout-items").innerHTML = items.map((product) => `
    <div class="checkout-item">
      <img src="${product.image}" alt="" />
      <div><strong>${product.name}</strong><span>Qty ${cart[product.id]} · ${formatPrice(product.price)} each</span></div>
      <span class="checkout-item-price">${formatPrice(product.price * cart[product.id])}</span>
    </div>
  `).join("");
  document.querySelector("#checkout-subtotal").textContent = formatPrice(subtotal);
  document.querySelector("#checkout-shipping").textContent = shipping === 0 ? "Free" : formatPrice(shipping);
  document.querySelector("#checkout-total").textContent = formatPrice(subtotal + shipping);
}

function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validatePaymentForm() {
  const cardName = document.querySelector("#checkout-card-name");
  const cardNumber = document.querySelector("#checkout-card-number");
  const cardExpiry = document.querySelector("#checkout-card-expiry");
  const cardCvv = document.querySelector("#checkout-card-cvv");

  const cleanedCardNumber = (cardNumber.value || "").replace(/\s+/g, "");
  const expiryValue = (cardExpiry.value || "").trim();
  const cvvValue = (cardCvv.value || "").trim();

  if (!cardName.value.trim()) return { valid: false, message: "Enter the name on the card." };
  if (!/^\d{13,19}$/.test(cleanedCardNumber)) return { valid: false, message: "Enter a valid card number." };
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryValue)) return { valid: false, message: "Enter the expiration date as MM/YY." };

  const [monthText, yearText] = expiryValue.split("/");
  const month = Number(monthText);
  const year = Number(`20${yearText}`);
  const now = new Date();
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  if (Number.isNaN(month) || Number.isNaN(year) || expiryDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
    return { valid: false, message: "The card expiration date must be in the future." };
  }

  if (!/^\d{3,4}$/.test(cvvValue)) return { valid: false, message: "Enter a valid security code." };
  return { valid: true, message: "" };
}

function changeQuantity(productId, amount) {
  const nextQuantity = (cart[productId] || 0) + amount;
  if (nextQuantity > 0) cart[productId] = nextQuantity;
  else delete cart[productId];
  saveCart();
  renderCart();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function openCart() {
  cartDrawer.hidden = false;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  cartDrawer.hidden = true;
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.querySelector("#open-cart").focus();
}

if (productGrid) {
  productGrid.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add]");
    if (!addButton) return;
    const product = products.find((item) => item.id === addButton.dataset.add);
    changeQuantity(product.id, 1);
    showToast(`${product.name} added to your bag`);
  });

  cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) changeQuantity(quantityButton.dataset.quantity, Number(quantityButton.dataset.change));
  });

  document.querySelectorAll(".category-tab").forEach((tab) => tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    document.querySelectorAll(".category-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
    renderProducts();
  }));

  document.querySelectorAll("[data-nav-category]").forEach((link) => link.addEventListener("click", () => {
    activeCategory = link.dataset.navCategory;
    document.querySelectorAll(".category-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.category === activeCategory));
    renderProducts();
  }));

  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  document.querySelector("#open-cart").addEventListener("click", openCart);
  document.querySelector("#close-cart").addEventListener("click", closeCart);
  document.querySelector("#continue-shopping").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cartDrawer.hidden) closeCart();
  });
  document.querySelector("#checkout-button").addEventListener("click", () => {
    if (cartQuantity()) window.location.href = `checkout.html?cart=${encodeURIComponent(JSON.stringify(cart))}`;
  });
  document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelector("#newsletter-message").textContent = "You're on the list. Keep an eye on your inbox!";
    event.currentTarget.reset();
  });

  renderProducts();
  renderCart();
  if (new URLSearchParams(window.location.search).get("openCart") === "1" && cartQuantity()) openCart();
}

if (document.querySelector("#checkout-form")) {
  renderCheckout();
  const cartQuery = JSON.stringify(cart);
  document.querySelectorAll("#back-to-bag, #back-to-store, #checkout-cart-link").forEach((link) => {
    const target = new URL(link.href, window.location.href);
    target.searchParams.set("cart", cartQuery);
    if (link.id === "back-to-bag" || link.id === "checkout-cart-link") target.searchParams.set("openCart", "1");
    link.href = target.href;
  });

  const cardNumberInput = document.querySelector("#checkout-card-number");
  const cardExpiryInput = document.querySelector("#checkout-card-expiry");
  const cardCvvInput = document.querySelector("#checkout-card-cvv");

  document.querySelector("#fill-demo-checkout").addEventListener("click", () => {
    Object.entries(window.checkoutDemoData).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
    });
    document.querySelector("#checkout-demo-message").textContent = "Demo details filled. This test card is not charged.";
  });

  cardNumberInput.addEventListener("input", (event) => {
    event.target.value = formatCardNumber(event.target.value);
  });
  cardExpiryInput.addEventListener("input", (event) => {
    event.target.value = formatExpiry(event.target.value);
  });
  cardCvvInput.addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  });

  document.querySelector("#checkout-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const feedback = document.querySelector("#checkout-feedback");
    const validation = validatePaymentForm();

    if (!validation.valid) {
      feedback.textContent = validation.message;
      const invalidField = document.querySelector("#checkout-card-name:invalid, #checkout-card-number:invalid, #checkout-card-expiry:invalid, #checkout-card-cvv:invalid") || document.querySelector("#checkout-card-name");
      invalidField.focus();
      return;
    }

    if (cartQuantity() === 0) {
      feedback.textContent = "Add an item to your bag before placing a demo order.";
      return;
    }

    try {
      const purchasedItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        return { id: product.id, name: product.name, quantity, price: product.price };
      });
      const subtotal = cartSubtotal();
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE;
      const order = {
        number: `MS-${Date.now().toString(36).toUpperCase()}`,
        items: purchasedItems,
        subtotal,
        shipping,
        total: subtotal + shipping
      };
      const savedProducts = JSON.parse(localStorage.getItem(PURCHASED_PRODUCTS_STORAGE_KEY) || "[]");
      const purchasedProducts = new Set(
        Array.isArray(savedProducts) ? savedProducts.filter((productId) => products.some((product) => product.id === productId)) : []
      );
      const savedPurchaseCounts = JSON.parse(localStorage.getItem(PRODUCT_PURCHASE_COUNTS_STORAGE_KEY) || "{}");
      const purchaseCounts = savedPurchaseCounts && typeof savedPurchaseCounts === "object" && !Array.isArray(savedPurchaseCounts)
        ? Object.fromEntries(
          Object.entries(savedPurchaseCounts).filter(([productId, count]) =>
            products.some((product) => product.id === productId) && Number.isInteger(count) && count >= 0
          )
        )
        : {};
      purchasedProducts.forEach((productId) => {
        purchaseCounts[productId] = Math.max(purchaseCounts[productId] || 0, 1);
      });
      Object.keys(cart).forEach((productId) => {
        purchasedProducts.add(productId);
        purchaseCounts[productId] = (purchaseCounts[productId] || 0) + 1;
      });
      localStorage.setItem(PURCHASED_PRODUCTS_STORAGE_KEY, JSON.stringify([...purchasedProducts]));
      localStorage.setItem(PRODUCT_PURCHASE_COUNTS_STORAGE_KEY, JSON.stringify(purchaseCounts));
      sessionStorage.setItem(LAST_DEMO_ORDER_STORAGE_KEY, JSON.stringify(order));
      localStorage.setItem("morrow-cart", "{}");
    } catch (error) {
      console.error("Could not record purchased products.", error);
      feedback.textContent = "We couldn't record your demo order. Please try again.";
      return;
    }

    window.location.assign("thank-you.html");
  });
}