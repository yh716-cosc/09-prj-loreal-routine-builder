/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Keep track of selected products */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div 
      class="product-card${selectedProducts.some(p => p.id === product.id) ? " selected" : ""}" 
      data-product-id="${product.id}"
      tabindex="0"
    >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = Number(card.getAttribute("data-product-id"));
      toggleProductSelection(productId, products);
    });
    // Optional: allow keyboard selection for accessibility
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const productId = Number(card.getAttribute("data-product-id"));
        toggleProductSelection(productId, products);
      }
    });
  });
}

/* Add or remove a product from the selected list */
function toggleProductSelection(productId, products) {
  const product = products.find((p) => p.id === productId);
  const alreadySelected = selectedProducts.some((p) => p.id === productId);

  if (alreadySelected) {
    // Remove from selected
    selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  } else {
    // Add to selected
    selectedProducts.push(product);
  }
  // Re-render products and selected list
  displayProducts(products);
  updateSelectedProductsList();
}

/* Show selected products in the sidebar */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected yet.</div>`;
    return;
  }
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product-item">
      <img src="${product.image}" alt="${product.name}">
      <div>
        <strong>${product.name}</strong><br>
        <span>${product.brand}</span>
      </div>
      <button class="remove-btn" data-remove-id="${product.id}" title="Remove">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(".remove-btn");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const removeId = Number(btn.getAttribute("data-remove-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== removeId);
      // Re-render both lists
      loadProducts().then((products) => {
        const selectedCategory = categoryFilter.value;
        const filteredProducts = products.filter(
          (product) => product.category === selectedCategory
        );
        displayProducts(filteredProducts);
        updateSelectedProductsList();
      });
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

