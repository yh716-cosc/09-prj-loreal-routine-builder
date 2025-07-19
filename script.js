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
      <!-- Description overlay for accessibility -->
      <div class="product-description-overlay" aria-live="polite">
        ${product.description}
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


const generateRoutineBtn = document.getElementById("generateRoutine");
const SYSTEM_PROMPT = `You are a helpful skincare and beauty advisor. Based on the user's selected products (including brand, name, category, and description), generate a personalized and logically ordered routine. Keep it clear, concise, and tailored to the product functions. 
You should only answer questions that relate to the generated routine or to topics like skincare, haircare, makeup, fragrance, and other related areas. If the user asks about unrelated topics, politely redirect them to focus on their routine or related beauty topics. You should also 
be able to remember the user's previous questions and answers to provide more contextually relevant responses.`;

let messageHistory = [
  { role: "system", content: SYSTEM_PROMPT }
];

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold with **
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')       // bold with *
    .replace(/\n/g, '<br>');
}

function renderMessages() {
  chatWindow.innerHTML = messageHistory
    .filter(m => m.role !== "system")
    .map(m => {
      if (m.role === "user") return `<div><strong>You:</strong> ${formatMarkdown(m.content)}</div>`;
      if (m.role === "assistant") return `<div><strong>AI:</strong> ${formatMarkdown(m.content)}</div>`;
    })
    .join("");
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function generateRoutine() {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<p><strong>System:</strong> Please select some products first!</p>`;
    return;
  }

  const productData = selectedProducts.map(({ name, brand, category, description }) => ({
    name,
    brand,
    category,
    description,
  }));

  const userMessage = `Here are the products: ${JSON.stringify(productData, null, 2)}\nPlease create a step-by-step routine using them.`;
  messageHistory.push({ role: "user", content: userMessage });

  renderMessages();
  chatWindow.innerHTML += `<p><em>Generating your routine...</em></p>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messageHistory,
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const aiMessage = result.choices[0].message.content;
    messageHistory.push({ role: "assistant", content: aiMessage });
    renderMessages();
  } catch (error) {
    chatWindow.innerHTML += `<p style=\"color: red;\"><strong>Error:</strong> Failed to generate routine. Please try again later.</p>`;
    console.error("Routine generation error:", error);
  }

  saveSelectedProducts();
}

generateRoutineBtn.addEventListener("click", generateRoutine);

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const question = input.value.trim();
  if (!question) return;

  messageHistory.push({ role: "user", content: question });
  renderMessages();
  input.value = "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messageHistory,
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const aiMessage = result.choices[0].message.content;
    messageHistory.push({ role: "assistant", content: aiMessage });
    renderMessages();
  } catch (error) {
    chatWindow.innerHTML += `<p style=\"color: red;\"><strong>Error:</strong> Failed to respond. Please try again later.</p>`;
    console.error("Follow-up error:", error);
  }
});

function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function loadSelectedProductsFromStorage() {
  const stored = localStorage.getItem("selectedProducts");
  if (stored) {
    try {
      selectedProducts = JSON.parse(stored);
      updateSelectedProductsList();
    } catch (e) {
      console.error("Failed to parse saved products:", e);
    }
  }
}

window.addEventListener("load", () => {
  loadSelectedProductsFromStorage();
});

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

  selectedProductsList.innerHTML += `<button id="clearAllBtn" class="remove-btn" style="margin-top:10px;color:#000;font-weight:bold;">Clear All</button>`;

  const removeBtns = selectedProductsList.querySelectorAll(".remove-btn[data-remove-id]");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const removeId = Number(btn.getAttribute("data-remove-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== removeId);
      saveSelectedProducts();
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

  document.getElementById("clearAllBtn").addEventListener("click", () => {
    selectedProducts = [];
    saveSelectedProducts();
    updateSelectedProductsList();
    loadProducts().then((products) => {
      const selectedCategory = categoryFilter.value;
      const filteredProducts = products.filter(
        (product) => product.category === selectedCategory
      );
      displayProducts(filteredProducts);
    });
  });
}