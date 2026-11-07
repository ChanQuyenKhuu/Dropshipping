const PRODUCT_REVIEWS_STORAGE_KEY = "morrow-product-reviews";
const LEGACY_RATINGS_STORAGE_KEY = "morrow-verified-product-ratings";
const REVIEWS_PURCHASED_PRODUCTS_STORAGE_KEY = "morrow-purchased-products";
const productGridForRatings = document.querySelector("#product-grid");

function loadPurchasedProducts() {
  try {
    const savedProducts = JSON.parse(localStorage.getItem(REVIEWS_PURCHASED_PRODUCTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(savedProducts) ? savedProducts.filter((productId) => typeof productId === "string") : []);
  } catch (error) {
    console.error("Could not load purchased products.", error);
    return new Set();
  }
}

let purchasedProducts = loadPurchasedProducts();

function isValidReview(review) {
  return review && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 &&
    typeof review.comment === "string" && typeof review.date === "string";
}

function loadProductReviews() {
  try {
    const savedReviews = JSON.parse(localStorage.getItem(PRODUCT_REVIEWS_STORAGE_KEY) || "{}");
    if (savedReviews && typeof savedReviews === "object" && !Array.isArray(savedReviews)) {
      return Object.fromEntries(
        Object.entries(savedReviews)
          .filter(([productId, reviews]) => productGridForRatings.querySelector(`[data-product-rating="${CSS.escape(productId)}"]`) && Array.isArray(reviews))
          .map(([productId, reviews]) => [productId, reviews.filter(isValidReview)])
      );
    }

    return {};
  } catch (error) {
    console.error("Could not load product reviews.", error);
    return {};
  }
}

function loadLegacyRatings() {
  try {
    const savedRatings = JSON.parse(localStorage.getItem(LEGACY_RATINGS_STORAGE_KEY) || "{}");
    if (!savedRatings || typeof savedRatings !== "object" || Array.isArray(savedRatings)) return {};

    return Object.fromEntries(
      Object.entries(savedRatings)
        .filter(([productId, rating]) => purchasedProducts.has(productId) && Number.isInteger(rating) && rating >= 1 && rating <= 5)
        .map(([productId, rating]) => [productId, [{ rating, comment: "", date: "" }]])
    );
  } catch (error) {
    console.error("Could not load previous product ratings.", error);
    return {};
  }
}

let productReviews = loadProductReviews();
const legacyProductReviews = loadLegacyRatings();
Object.entries(legacyProductReviews).forEach(([productId, reviews]) => {
  if (!productReviews[productId]?.length) productReviews[productId] = reviews;
});

function reviewsFor(productId) {
  return productReviews[productId] || [];
}

function updateRatingWidget(widget) {
  const stars = widget.querySelector(".rating-stars");
  const productId = widget.dataset.productRating;
  const productName = widget.closest(".product-card").querySelector(".product-name").textContent;
  const reviews = reviewsFor(productId);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;

  if (!stars.dataset.initialized) {
    const button = document.createElement("button");
    button.className = "rating-star";
    button.type = "button";
    button.setAttribute("aria-hidden", "false");
    button.textContent = "★★★★★";
    stars.append(button);
    stars.dataset.initialized = "true";
  }

  const button = stars.querySelector(".rating-star");
  button.setAttribute("aria-label", `View ${reviews.length} ratings and comments for ${productName}`);
  button.style.setProperty("--rating-fill", `${average / 5 * 100}%`);
  widget.querySelector(".rating-label").textContent = reviews.length
    ? `${average.toFixed(1)} (${reviews.length})`
    : "Write the first review";
}

function renderProductRatings() {
  productGridForRatings.querySelectorAll("[data-product-rating]").forEach(updateRatingWidget);
}

const reviewDialog = document.createElement("dialog");
reviewDialog.className = "product-reviews-dialog";
reviewDialog.setAttribute("aria-labelledby", "reviews-title");
reviewDialog.innerHTML = `
  <div class="reviews-header">
    <div><span class="eyebrow">The good word</span><h2 id="reviews-title"></h2></div>
    <button class="icon-button reviews-close" type="button" aria-label="Close reviews">×</button>
  </div>
  <div class="reviews-summary"></div>
  <p class="reviews-empty"></p>
  <ol class="reviews-list"></ol>
  <form class="review-form">
    <h3>Leave a review</h3>
    <fieldset class="review-rating-field">
      <legend>Your rating</legend>
      <div class="review-rating-stars" role="group" aria-label="Choose a rating from 1 to 5">
        <button type="button" data-review-rating="1" aria-label="1 out of 5">★</button>
        <button type="button" data-review-rating="2" aria-label="2 out of 5">★</button>
        <button type="button" data-review-rating="3" aria-label="3 out of 5">★</button>
        <button type="button" data-review-rating="4" aria-label="4 out of 5">★</button>
        <button type="button" data-review-rating="5" aria-label="5 out of 5">★</button>
      </div>
    </fieldset>
    <label class="review-comment-label">Your comment
      <textarea name="comment" rows="4" maxlength="500" required placeholder="What did you think? (Up to 500 characters)"></textarea>
    </label>
    <button class="button button-dark review-submit" type="submit">Post review <span aria-hidden="true">↗</span></button>
    <p class="review-form-message" aria-live="polite"></p>
  </form>
  <p class="review-purchase-note"></p>
`;
document.body.append(reviewDialog);

let activeReviewProductId = "";
let selectedReviewRating = 0;

function formatReviewDate(date) {
  if (!date) return "Previous rating";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "Customer review"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(parsedDate);
}

function renderReviews(productId) {
  const reviews = reviewsFor(productId);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const list = reviewDialog.querySelector(".reviews-list");
  const emptyMessage = reviewDialog.querySelector(".reviews-empty");

  reviewDialog.querySelector("#reviews-title").textContent = productGridForRatings
    .querySelector(`[data-product-rating="${CSS.escape(productId)}"]`)
    .closest(".product-card").querySelector(".product-name").textContent;
  reviewDialog.querySelector(".reviews-summary").textContent = reviews.length
    ? `${average.toFixed(1)} out of 5 · ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
    : "No reviews yet";
  emptyMessage.textContent = reviews.length ? "" : "Be the first to share what you think.";
  list.replaceChildren();

  reviews.slice().reverse().forEach((review) => {
    const item = document.createElement("li");
    item.className = "product-review";
    const heading = document.createElement("div");
    heading.className = "product-review-heading";
    const rating = document.createElement("span");
    rating.className = "product-review-stars";
    rating.setAttribute("aria-label", `${review.rating} out of 5 stars`);
    rating.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
    const date = document.createElement("time");
    date.textContent = formatReviewDate(review.date);
    heading.append(rating, date);
    const comment = document.createElement("p");
    comment.textContent = review.comment || "No comment provided.";
    item.append(heading, comment);
    list.append(item);
  });

  const canReview = purchasedProducts.has(productId);
  const form = reviewDialog.querySelector(".review-form");
  form.hidden = !canReview;
  reviewDialog.querySelector(".review-purchase-note").textContent = canReview
    ? ""
    : "Complete a demo checkout with this item to leave a review. No payment is charged.";
}

function openReviews(productId) {
  activeReviewProductId = productId;
  selectedReviewRating = 0;
  const form = reviewDialog.querySelector(".review-form");
  form.reset();
  reviewDialog.querySelector(".review-form-message").textContent = "";
  reviewDialog.querySelectorAll("[data-review-rating]").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderReviews(productId);
  reviewDialog.showModal();
}

function renderProductRatingsAfterStorageChange() {
  purchasedProducts = loadPurchasedProducts();
  productReviews = loadProductReviews();
  Object.entries(legacyProductReviews).forEach(([productId, reviews]) => {
    if (!productReviews[productId]?.length) productReviews[productId] = reviews;
  });
  renderProductRatings();
  if (reviewDialog.open && activeReviewProductId) renderReviews(activeReviewProductId);
}

if (productGridForRatings) {
  productGridForRatings.addEventListener("click", (event) => {
    const button = event.target.closest(".rating-star");
    const widget = button?.closest("[data-product-rating]");
    if (button && widget && productGridForRatings.contains(widget)) {
      openReviews(widget.dataset.productRating);
    }
  });

  reviewDialog.querySelector(".reviews-close").addEventListener("click", () => reviewDialog.close());
  reviewDialog.addEventListener("click", (event) => {
    if (event.target === reviewDialog) reviewDialog.close();
  });

  reviewDialog.querySelector(".review-rating-stars").addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-rating]");
    if (!button) return;

    selectedReviewRating = Number(button.dataset.reviewRating);
    reviewDialog.querySelectorAll("[data-review-rating]").forEach((star) => {
      const selected = Number(star.dataset.reviewRating) <= selectedReviewRating;
      star.classList.toggle("is-selected", selected);
      star.setAttribute("aria-pressed", String(Number(star.dataset.reviewRating) === selectedReviewRating));
    });
  });

  reviewDialog.querySelector(".review-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const message = reviewDialog.querySelector(".review-form-message");

    if (!purchasedProducts.has(activeReviewProductId)) {
      message.textContent = "Complete a demo checkout with this item before leaving a review.";
      return;
    }
    if (!Number.isInteger(selectedReviewRating) || selectedReviewRating < 1 || selectedReviewRating > 5) {
      message.textContent = "Choose a star rating before posting your review.";
      return;
    }

    const comment = new FormData(event.currentTarget).get("comment").toString().trim();
    if (!comment) {
      message.textContent = "Add a comment before posting your review.";
      return;
    }

    const previousReviews = productReviews[activeReviewProductId] || [];
    productReviews[activeReviewProductId] = [
      ...previousReviews,
      { rating: selectedReviewRating, comment, date: new Date().toISOString() }
    ];

    try {
      localStorage.setItem(PRODUCT_REVIEWS_STORAGE_KEY, JSON.stringify(productReviews));
    } catch (error) {
      productReviews[activeReviewProductId] = previousReviews;
      console.error("Could not save product review.", error);
      message.textContent = "We couldn't save your review. Please try again.";
      return;
    }

    message.textContent = "Thanks for sharing your review.";
    event.currentTarget.reset();
    selectedReviewRating = 0;
    reviewDialog.querySelectorAll("[data-review-rating]").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    renderReviews(activeReviewProductId);
    renderProductRatings();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === PRODUCT_REVIEWS_STORAGE_KEY || event.key === REVIEWS_PURCHASED_PRODUCTS_STORAGE_KEY || event.key === null) {
      renderProductRatingsAfterStorageChange();
    }
  });

  new MutationObserver(renderProductRatings).observe(productGridForRatings, { childList: true });
  renderProductRatings();
}
