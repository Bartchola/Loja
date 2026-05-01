const API_BASE = "http://localhost:3001";

const storeClosedOverlay = document.getElementById("storeClosedOverlay");
let isStoreOpen = true;

const publicReviewsList = document.getElementById("publicReviewsList");

const promoDayList = document.getElementById("promoDayList");

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
const customerZipcodeInput = document.querySelector("#customerZipcode");
const customerStreetInput = document.querySelector("#customerStreet");
const customerDistrictInput = document.querySelector("#customerDistrict");
const customerCityInput = document.querySelector("#customerCity");
const customerStateInput = document.querySelector("#customerState");
const customerNumberInput = document.querySelector("#customerNumber");
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

let toastTimeout = null;

function showToast(message) {
  let toast = document.querySelector(".toast-message");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

let cart = [];
let activeCategory = "Todos";
let menuItems = Array.isArray(config.menu) ? config.menu.map(normalizeMenuItem) : [];

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

function createPlaceholderImage() {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <rect width="100%" height="100%" fill="#f2f2f2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-family="Arial" font-size="28">
        Sem imagem
      </text>
    </svg>
  `)}`;
}

function resolveImagePath(image) {
  if (!image) return createPlaceholderImage();
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image;
  if (image.startsWith("/assets/")) return `${API_BASE}${image}`;
  if (image.startsWith("../") || image.startsWith("./")) return image;
  return `${API_BASE}/assets/images/${image}`;
}

function normalizeMenuItem(item) {
  return {
    ...item,
    id: Number(item.id),
    price: Number(item.price || 0),
    promotionalPrice: item.promotionalPrice ? Number(item.promotionalPrice) : null,
    isPromotion: Boolean(item.isPromotion),
    promotionLabel: item.promotionLabel || "",
    image: resolveImagePath(item.image)
  };
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCategories() {
  if (!Array.isArray(menuItems) || !menuItems.length) return ["Todos"];
  const categories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];
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
    zipcode: formData.get("customerZipcode")?.toString().trim() || "",
    city: formData.get("customerCity")?.toString().trim() || "",
    state: formData.get("customerState")?.toString().trim() || "",
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

function formatZipcode(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

async function fetchAddressByCep(cep) {
  const cleanCep = cep.replace(/\D/g, "");

  if (!cleanCep) {
    return;
  }

  if (cleanCep.length !== 8) {
    return;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      alert("CEP não encontrado.");
      return;
    }

    if (customerStreetInput) {
      customerStreetInput.value = data.logradouro || "";
    }

    if (customerDistrictInput) {
      customerDistrictInput.value = data.bairro || "";
    }

    if (customerCityInput) {
      customerCityInput.value = data.localidade || "";
    }

    if (customerStateInput) {
      customerStateInput.value = data.uf || "";
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    alert("Não foi possível buscar o CEP.");
  }
}

async function checkStoreIsOpen() {
  try {
    const response = await fetch(`${API_BASE}/api/store/status`);
    const result = await response.json();

    return Boolean(result.isOpen);
  } catch {
    return true;
  }
}

async function handleCheckoutSubmit(event) {
  if (!isStoreOpen) {
  alert("A loja está fechada no momento.");
  return;
}

  event.preventDefault();
  const storeOpen = await checkStoreIsOpen();

if (!storeOpen) {
  alert("A loja está fechada no momento. Tente novamente mais tarde.");
  return;
}

  if (!cart.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const houseNumber = document.querySelector("#customerNumber")?.value?.trim() || "";
  const street = document.querySelector("#customerStreet")?.value?.trim() || "";
  const district = document.querySelector("#customerDistrict")?.value?.trim() || "";

  if (!street || street.length < 5) {
    alert("Digite um endereço válido.");
    return;
  }

  if (!/^\d+$/.test(houseNumber)) {
    alert("O número da casa deve conter apenas números.");
    return;
  }

  if (!district || district.length < 3) {
    alert("Digite um bairro válido.");
    return;
  }

  if (
  !customerName.value.trim() ||
  !customerPhone.value.trim()
) {
  alert("Preencha nome e telefone.");
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
  street: addressData.logradouro || streetInput.value,
  number: numberInput.value,
  district: addressData.bairro || districtInput.value,
  city: addressData.localidade || "",
  state: addressData.uf || "",
  cep: cepValue || "",
  complement: complementInput.value,
  reference: referenceInput.value
},
    payment: {
      method: checkoutData.paymentMethod,
      changeFor: checkoutData.changeFor || ""
    },
    notes: checkoutData.notes,
    items: cart,
    subtotal: getCartSubtotal(),
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
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
  if (!isStoreOpen) {
  alert("A loja está fechada no momento.");
  return;
}

const finalPrice =
  item.isPromotion && item.promotionalPrice
    ? item.promotionalPrice
    : item.price;

  const existingItem = cart.find((cartItem) => cartItem.id === item.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
  ...item,
  price: finalPrice,
  originalPrice: item.price,
  quantity: 1
});
  }

  updateCartCount();
  renderCart();
  showToast(`${item.name} adicionado ao carrinho`);
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
      renderPromoDay();
    });
  });
}

function renderMenu() {
  if (!menuGrid || !Array.isArray(menuItems)) return;

  const filteredItems =
    activeCategory === "Todos"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  if (!filteredItems.length) {
    menuGrid.innerHTML = `
      <div class="cart-empty-state">
        <strong>Nenhum item disponível nesta categoria.</strong>
      </div>
    `;
    return;
  }

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
              ${
  item.isPromotion
    ? `<span class="promo-badge">${item.promotionLabel || "Promoção"}</span>`
    : ""
}
              <h3>${item.name}</h3>
              <p>${item.description}</p>
            </div>

            <div class="menu-card-bottom">
              <div class="price-area">
  ${
    item.isPromotion && item.promotionalPrice
      ? `
        <span class="old-price">${formatPrice(item.price)}</span>
        <strong class="promo-price">${formatPrice(item.promotionalPrice)}</strong>
      `
      : `<strong>${formatPrice(item.price)}</strong>`
  }
</div>

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
      const selectedItem = menuItems.find((item) => item.id === itemId);

      if (selectedItem) {
        addToCart(selectedItem);
      }
    });
  });
}

async function loadMenuFromApi() {
  try {
    if (menuGrid) {
      menuGrid.innerHTML = `
        <div class="cart-empty-state">
          <strong>Carregando cardápio...</strong>
        </div>
      `;
    }

    const response = await fetch(`${API_BASE}/api/menu?t=${Date.now()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar cardápio.");
    }

    const apiItems = Array.isArray(result.items)
      ? result.items
      : Array.isArray(result)
        ? result
        : [];

    menuItems = apiItems.map(normalizeMenuItem);

    activeCategory = "Todos";

    renderCategoryFilters();
    renderMenu();
    renderPromoDay();
  } catch (error) {
    console.error("Erro ao carregar cardápio da API:", error);

    menuItems = [];

    if (categoryFilters) {
      categoryFilters.innerHTML = "";
    }

    if (menuGrid) {
      menuGrid.innerHTML = `
        <div class="cart-empty-state">
          <strong>Não foi possível carregar o cardápio.</strong>
          <p>Verifique se o backend está ligado.</p>
        </div>
      `;
    }
  }
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

if (customerNumberInput) {
  customerNumberInput.addEventListener("input", () => {
    customerNumberInput.value = customerNumberInput.value.replace(/\D/g, "");
  });
}

if (customerZipcodeInput) {
  customerZipcodeInput.addEventListener("input", () => {
    customerZipcodeInput.value = formatZipcode(customerZipcodeInput.value);
  });

  customerZipcodeInput.addEventListener("blur", () => {
    fetchAddressByCep(customerZipcodeInput.value);
  });
}

function renderStars(rating) {
  const value = Number(rating || 0);
  return "⭐".repeat(value) + "☆".repeat(5 - value);
}

function formatReviewDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

async function loadPublicReviews() {
  if (!publicReviewsList) return;

  try {
    publicReviewsList.innerHTML = `<p class="reviews-empty">Carregando avaliações...</p>`;

    const response = await fetch(`${API_BASE}/api/store/reviews`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar avaliações.");
    }

    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

    const recentReviews = reviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (!recentReviews.length) {
      publicReviewsList.innerHTML = `
        <p class="reviews-empty">Ainda não temos avaliações públicas.</p>
      `;
      return;
    }

    publicReviewsList.innerHTML = recentReviews
      .map(
        (review) => `
          <article class="public-review-card">
            <div class="public-review-top">
              <strong>Pedido ${review.orderId}</strong>
              <span>${formatReviewDate(review.createdAt)}</span>
            </div>

            <p class="public-review-stars">${renderStars(review.rating)}</p>

            ${
              review.comment
                ? `<p class="public-review-comment">“${review.comment}”</p>`
                : `<p class="public-review-comment">Cliente avaliou sem comentário.</p>`
            }
          </article>
        `
      )
      .join("");
  } catch (error) {
    console.error("Erro ao carregar avaliações públicas:", error);

    publicReviewsList.innerHTML = `
      <p class="reviews-empty">Não foi possível carregar as avaliações agora.</p>
    `;
  }
}

async function loadStoreStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/store/status`);
    const result = await response.json();

    isStoreOpen = Boolean(result.isOpen);

    if (!isStoreOpen) {
      storeClosedOverlay.classList.remove("hidden");
    } else {
      storeClosedOverlay.classList.add("hidden");
    }

  } catch (error) {
    console.error("Erro ao verificar status da loja:", error);
  }
}

function renderPromoDay() {
  if (!promoDayList) return;

  const promoItems = menuItems.filter(
    (item) => item.isPromotion && item.promotionalPrice
  );

  if (!promoItems.length) {
    promoDayList.innerHTML = `
      <p class="promo-empty">Nenhuma promoção disponível no momento.</p>
    `;
    return;
  }

  promoDayList.innerHTML = promoItems
    .slice(0, 6)
    .map(
      (item) => `
        <article class="promo-day-card">
          <div class="promo-image-wrapper">
            <img src="${item.image}" alt="${item.name}" />
            <span class="promo-badge">🔥 ${item.promotionLabel || "Promoção"}</span>
          </div>

          <div class="promo-content">
            <h3>${item.name}</h3>

            <div class="promo-price-area">
              <span class="old-price">${formatPrice(item.price)}</span>
              <strong class="promo-price">${formatPrice(item.promotionalPrice)}</strong>
            </div>

            <button class="promo-btn" type="button" data-promo-add-to-cart="${item.id}">
  Adicionar
</button>
          </div>
        </article>
      `
    )
    .join("");

    promoDayList.querySelectorAll("[data-promo-add-to-cart]").forEach((button) => {
  button.addEventListener("click", () => {
    const itemId = Number(button.getAttribute("data-promo-add-to-cart"));
    const selectedItem = menuItems.find((item) => item.id === itemId);

    if (selectedItem) {
      addToCart(selectedItem);
    }
  });
});
}

renderCart();
updateCartCount();
loadMenuFromApi();
loadMenuFromApi();
loadPublicReviews();
loadStoreStatus();