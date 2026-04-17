const brandName = document.querySelector("[data-brand-name]");
const brandTagline = document.querySelector("[data-brand-tagline]");
const brandMark = document.querySelector("[data-brand-mark]");
const heroEyebrow = document.querySelector(".hero .eyebrow");
const heroTitle = document.querySelector(".hero h1");
const heroDescription = document.querySelector(".hero p:last-child");

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

const cartCount = document.querySelector("[data-cart-count]");
const cartCountMobile = document.querySelector("[data-cart-count-mobile]");
const menuGrid = document.querySelector("[data-menu-grid]");
const categoryFilters = document.querySelector("[data-category-filters]");
const root = document.documentElement;

const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const checkoutModal = document.querySelector("[data-checkout-modal]");
const checkoutOverlay = document.querySelector("[data-checkout-overlay]");
const checkoutCloseButtons = document.querySelectorAll("[data-checkout-close]");
const checkoutBackButton = document.querySelector("[data-checkout-back]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutSummaryItems = document.querySelector("[data-checkout-summary-items]");
const checkoutTotal = document.querySelector("[data-checkout-total]");
const paymentMethodField = document.querySelector("#paymentMethod");
const changeField = document.querySelector("[data-change-field]");
const changeInput = document.querySelector("#changeFor");
const cartCloseButtons = document.querySelectorAll("[data-cart-close]");
const cartItemsContainer = document.querySelector("[data-cart-items]");
const cartSubtotal = document.querySelector("[data-cart-subtotal]");
const cartClearButton = document.querySelector("[data-cart-clear]");
const cartFinishButton = document.querySelector("[data-cart-finish]");

const cartOpenButtons = document.querySelectorAll(".cart-button");

const config = window.storeConfig || {};

let cart = [];
let activeCategory = "Todos";

if (config.theme?.primaryColor) {
  root.style.setProperty("--accent", config.theme.primaryColor);
}

if (config.theme?.secondaryColor) {
  root.style.setProperty("--accent-dark", config.theme.secondaryColor);
}

if (config.brand?.name && brandName) {
  brandName.textContent = config.brand.name;
  document.title = `${config.brand.name} | Loja de Frango Frito`;
}

if (config.brand?.tagline && brandTagline) {
  brandTagline.textContent = config.brand.tagline;
}

if (config.brand?.mark && brandMark) {
  brandMark.textContent = config.brand.mark;
}

if (config.hero?.eyebrow && heroEyebrow) {
  heroEyebrow.textContent = config.hero.eyebrow;
}

if (config.hero?.title && heroTitle) {
  heroTitle.textContent = config.hero.title;
}

if (config.hero?.description && heroDescription) {
  heroDescription.textContent = config.hero.description;
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCategories() {
  if (!Array.isArray(config.menu)) return ["Todos"];
  const categories = [...new Set(config.menu.map((item) => item.category))];
  return ["Todos", ...categories];
}

function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
  }

  if (cartCountMobile) {
    cartCountMobile.textContent = totalItems;
  }
}

function getCartSubtotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function openCart() {
  document.body.classList.add("cart-open");
  if (cartDrawer) {
    cartDrawer.setAttribute("aria-hidden", "false");
  }
}

function closeCart() {
  document.body.classList.remove("cart-open");
  if (cartDrawer) {
    cartDrawer.setAttribute("aria-hidden", "true");
  }
}

function openCheckout() {
  if (!cart.length) return;

  document.body.classList.add("checkout-open");
  if (checkoutModal) {
    checkoutModal.setAttribute("aria-hidden", "false");
  }

  renderCheckoutSummary();
}

function closeCheckout() {
  document.body.classList.remove("checkout-open");
  if (checkoutModal) {
    checkoutModal.setAttribute("aria-hidden", "true");
  }
}

function renderCheckoutSummary() {
  if (!checkoutSummaryItems || !checkoutTotal) return;

  if (!cart.length) {
    checkoutSummaryItems.innerHTML = `<p class="checkout-summary-empty">Seu pedido aparecerá aqui.</p>`;
    checkoutTotal.textContent = formatPrice(0);
    return;
  }

  checkoutSummaryItems.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity;

      return `
        <div class="checkout-summary-item">
          <div>
            <strong>${item.name}</strong>
            <span> x${item.quantity}</span>
          </div>
          <strong>${formatPrice(itemTotal)}</strong>
        </div>
      `;
    })
    .join("");

  checkoutTotal.textContent = formatPrice(getCartSubtotal());
}

function getCheckoutData() {
  if (!checkoutForm) return null;

  const formData = new FormData(checkoutForm);

  return {
    name: formData.get("customerName")?.toString().trim() || "",
    phone: formData.get("customerPhone")?.toString().trim() || "",
    street: formData.get("customerStreet")?.toString().trim() || "",
    number: formData.get("customerNumber")?.toString().trim() || "",
    district: formData.get("customerDistrict")?.toString().trim() || "",
    complement: formData.get("customerComplement")?.toString().trim() || "",
    reference: formData.get("customerReference")?.toString().trim() || "",
    paymentMethod: formData.get("paymentMethod")?.toString().trim() || "",
    changeFor: formData.get("changeFor")?.toString().trim() || "",
    notes: formData.get("customerNotes")?.toString().trim() || ""
  };
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  if (!cart.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const checkoutData = getCheckoutData();

  if (!checkoutData) return;

  const orderPayload = {
    customer: {
      name: checkoutData.name,
      phone: checkoutData.phone
    },
    address: {
      street: checkoutData.street,
      number: checkoutData.number,
      district: checkoutData.district,
      complement: checkoutData.complement,
      reference: checkoutData.reference
    },
    payment: {
      method: checkoutData.paymentMethod,
      changeFor: checkoutData.changeFor
    },
    notes: checkoutData.notes,
    items: cart,
    subtotal: getCartSubtotal(),
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage =
        result?.errors?.join("\n") ||
        result?.message ||
        "Não foi possível finalizar o pedido.";

      alert(errorMessage);
      return;
    }

    alert("Pedido confirmado com sucesso!");

    cart = [];
    updateCartCount();
    renderCart();

    checkoutForm.reset();

    if (changeField && changeInput) {
      changeField.classList.add("is-hidden");
      changeInput.required = false;
      changeInput.value = "";
    }

    closeCheckout();

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
  }
}

function addToCart(item) {
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      quantity: 1
    });
  }

  updateCartCount();
  renderCart();
  openCart();
}

function decreaseCartItem(itemId) {
  const item = cart.find((cartItem) => cartItem.id === itemId);
  if (!item) return;

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    cart = cart.filter((cartItem) => cartItem.id !== itemId);
  }

  updateCartCount();
  renderCart();
}

function increaseCartItem(itemId) {
  const item = cart.find((cartItem) => cartItem.id === itemId);
  if (!item) return;

  item.quantity += 1;
  updateCartCount();
  renderCart();
}

function removeCartItem(itemId) {
  cart = cart.filter((item) => item.id !== itemId);
  updateCartCount();
  renderCart();
}

function clearCart() {
  cart = [];
  updateCartCount();
  renderCart();
}

function getWhatsAppLink() {
  const phone = config.contact?.whatsapp || "";
  if (!phone) return null;

  const orderLines = cart.map((item) => {
    const lineTotal = item.price * item.quantity;
    return `• ${item.name} x${item.quantity} — ${formatPrice(lineTotal)}`;
  });

  const message = [
    `Olá! Quero fazer este pedido na ${config.brand?.name || "loja"}:`,
    "",
    ...orderLines,
    "",
    `Subtotal: ${formatPrice(getCartSubtotal())}`
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function finishOrder() {
  if (!cart.length) {
    alert("Adicione itens ao carrinho antes de finalizar.");
    return;
  }

  closeCart();
  openCheckout();
}

function renderCart() {
  if (!cartItemsContainer || !cartSubtotal) return;

  if (!cart.length) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i class="ti ti-shopping-bag" aria-hidden="true"></i>
        <strong>Seu carrinho está vazio</strong>
        <p>Adicione itens do cardápio para montar seu pedido.</p>
      </div>
    `;

    cartSubtotal.textContent = formatPrice(0);
    renderCheckoutSummary();
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity;

      return `
        <article class="cart-item">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
          </div>

          <div class="cart-item-content">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <span class="cart-item-price">${formatPrice(itemTotal)}</span>
          </div>

          <div class="cart-item-actions">
            <div class="cart-qty-controls">
              <button class="cart-qty-btn" type="button" data-cart-decrease="${item.id}" aria-label="Diminuir quantidade">
                -
              </button>

              <span class="cart-qty-value">${item.quantity}</span>

              <button class="cart-qty-btn" type="button" data-cart-increase="${item.id}" aria-label="Aumentar quantidade">
                +
              </button>
            </div>

            <button class="cart-remove-btn" type="button" data-cart-remove="${item.id}">
              Remover
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  cartSubtotal.textContent = formatPrice(getCartSubtotal());
  renderCheckoutSummary();

  cartItemsContainer.querySelectorAll("[data-cart-decrease]").forEach((button) => {
    button.addEventListener("click", () => {
      decreaseCartItem(Number(button.getAttribute("data-cart-decrease")));
    });
  });

  cartItemsContainer.querySelectorAll("[data-cart-increase]").forEach((button) => {
    button.addEventListener("click", () => {
      increaseCartItem(Number(button.getAttribute("data-cart-increase")));
    });
  });

  cartItemsContainer.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeCartItem(Number(button.getAttribute("data-cart-remove")));
    });
  });
}

function renderCategoryFilters() {
  if (!categoryFilters) return;

  const categories = getCategories();

  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="category-filter-btn ${category === activeCategory ? "is-active" : ""}"
          type="button"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join("");

  categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.getAttribute("data-category");
      renderCategoryFilters();
      renderMenu();
    });
  });
}

function renderMenu() {
  if (!menuGrid || !Array.isArray(config.menu)) return;

  const filteredItems =
    activeCategory === "Todos"
      ? config.menu
      : config.menu.filter((item) => item.category === activeCategory);

  menuGrid.innerHTML = filteredItems
    .map(
      (item) => `
        <article class="menu-card">
          <div class="menu-card-image">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
          </div>

          <div class="menu-card-content">
            <div class="menu-card-top">
              <span class="menu-category">${item.category}</span>
              <h3>${item.name}</h3>
              <p>${item.description}</p>
            </div>

            <div class="menu-card-bottom">
              <strong>${formatPrice(item.price)}</strong>

              <button class="menu-add-btn" type="button" data-add-to-cart="${item.id}">
                <i class="ti ti-plus" aria-hidden="true"></i>
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  menuGrid.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = Number(button.getAttribute("data-add-to-cart"));
      const selectedItem = config.menu.find((item) => item.id === itemId);

      if (selectedItem) {
        addToCart(selectedItem);
      }
    });
  });
}

if (menuToggle && siteNav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    siteNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    siteNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        closeMenu();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

cartOpenButtons.forEach((button) => {
  button.addEventListener("click", openCart);
});

cartCloseButtons.forEach((button) => {
  button.addEventListener("click", closeCart);
});

if (cartOverlay) {
  cartOverlay.addEventListener("click", closeCart);
}

if (cartClearButton) {
  cartClearButton.addEventListener("click", clearCart);
}

if (cartFinishButton) {
  cartFinishButton.addEventListener("click", finishOrder);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
  }
});

if (paymentMethodField && changeField && changeInput) {
  paymentMethodField.addEventListener("change", () => {
    const isCash = paymentMethodField.value === "Dinheiro";

    changeField.classList.toggle("is-hidden", !isCash);
    changeInput.required = isCash;

    if (!isCash) {
      changeInput.value = "";
    }
  });
}

checkoutCloseButtons.forEach((button) => {
  button.addEventListener("click", closeCheckout);
});

if (checkoutOverlay) {
  checkoutOverlay.addEventListener("click", closeCheckout);
}

if (checkoutBackButton) {
  checkoutBackButton.addEventListener("click", () => {
    closeCheckout();
    openCart();
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", handleCheckoutSubmit);
}

renderCategoryFilters();
renderMenu();
renderCart();
updateCartCount();