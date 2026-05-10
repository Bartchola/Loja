const API_BASE = "http://localhost:3001";

const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
  window.location.href = "./login.html";
}

function getAuthHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    Authorization: `Bearer ${adminToken}`
  };
}

async function checkAdminAuth() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/check`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!result.ok) {
      localStorage.removeItem("adminToken");
      window.location.href = "./login.html";
    }
  } catch {
    localStorage.removeItem("adminToken");
    window.location.href = "./login.html";
  }
}

checkAdminAuth();

const ordersList = document.getElementById("ordersList");
const menuList = document.getElementById("menuList");
const panelMenuSearchInput = document.getElementById("panelMenuSearchInput");
let panelMenuSearchTerm = "";
let allMenuItems = [];

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const refreshMenuBtn = document.getElementById("refreshMenuBtn");
const newItemBtn = document.getElementById("newItemBtn");
const refreshAllBtn = document.getElementById("refreshAllBtn");
const enableSoundBtn = document.getElementById("enableSoundBtn");
const toggleStoreBtn = document.getElementById("toggleStoreBtn");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const refreshReviewsBtn = document.getElementById("refreshReviewsBtn");
const reviewsList = document.getElementById("reviewsList");

const dashboardOrdersToday = document.getElementById("dashboardOrdersToday");
const dashboardRevenueToday = document.getElementById("dashboardRevenueToday");
const dashboardPreparing = document.getElementById("dashboardPreparing");
const dashboardFinished = document.getElementById("dashboardFinished");

const reviewsTotal = document.getElementById("reviewsTotal");
const reviewsAverage = document.getElementById("reviewsAverage");

const menuForm = document.getElementById("menuForm");
const menuModalOverlay = document.getElementById("menuModalOverlay");
const closeMenuModalBtn = document.getElementById("closeMenuModalBtn");
const menuModalTitle = document.getElementById("menuModalTitle");
const cancelFormBtn = document.getElementById("cancelFormBtn");

const itemId = document.getElementById("itemId");
const itemName = document.getElementById("itemName");
const itemCategory = document.getElementById("itemCategory");
const itemPrice = document.getElementById("itemPrice");
const itemIsPromotion = document.getElementById("itemIsPromotion");
const itemPromotionalPrice = document.getElementById("itemPromotionalPrice");
const itemPromotionLabel = document.getElementById("itemPromotionLabel");
const itemImageFile = document.getElementById("itemImageFile");
const currentImage = document.getElementById("currentImage");
const currentImageLabel = document.getElementById("currentImageLabel");
const itemDescription = document.getElementById("itemDescription");
const itemActive = document.getElementById("itemActive");
const itemAvailable = document.getElementById("itemAvailable");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const logoutBtn = document.getElementById("logoutBtn");

const openTimeInput = document.getElementById("openTimeInput");
const closeTimeInput = document.getElementById("closeTimeInput");
const toggleScheduleBtn = document.getElementById("toggleScheduleBtn");
const saveScheduleBtn = document.getElementById("saveScheduleBtn");

const saveContactBtn = document.getElementById("saveContactBtn");
const storePhoneInput = document.getElementById("storePhoneInput");
const storeEmailInput = document.getElementById("storeEmailInput");
const storeAddressInput = document.getElementById("storeAddressInput");
const storeHoursInput = document.getElementById("storeHoursInput");
const storeHoursHelp = document.getElementById("storeHoursHelp");

let autoScheduleEnabled = false;

const orderStatuses = [
  "Recebido",
  "Em preparo",
  "Saiu para entrega",
  "Pronto para retirada",
  "Finalizado"
];

let isFirstOrdersLoad = true;
let soundEnabled = false;
let audioContext = null;
let allOrders = [];
let storeIsOpen = true;

const savedKnownOrderIds = JSON.parse(localStorage.getItem("knownOrderIds") || "[]");
const savedNewOrderIds = JSON.parse(localStorage.getItem("newOrderIds") || "[]");

let knownOrderIds = new Set(savedKnownOrderIds);
let newOrderIds = new Set(savedNewOrderIds);

function saveOrderNotificationState() {
  localStorage.setItem("knownOrderIds", JSON.stringify([...knownOrderIds]));
  localStorage.setItem("newOrderIds", JSON.stringify([...newOrderIds]));
}

async function loadStoreContact() {
  try {
    const response = await fetch(`${API_BASE}/api/store/contact`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar contato.");
    }

    const contact = result.contact || {};

    if (storePhoneInput) storePhoneInput.value = contact.phone || "";
    if (storeEmailInput) storeEmailInput.value = contact.email || "";
    if (storeAddressInput) storeAddressInput.value = contact.address || "";
    if (storeHoursInput) storeHoursInput.value = contact.displayHours || "";

    if (storeHoursInput && contact.autoScheduleEnabled) {
      storeHoursInput.disabled = true;
    } else if (storeHoursInput) {
      storeHoursInput.disabled = false;
    }

    if (storeHoursHelp) {
      storeHoursHelp.textContent = contact.autoScheduleEnabled
        ? "Automação ativa: o horário exibido vem da programação automática."
        : "Automação desligada: este texto será exibido no site.";
    }
  } catch (error) {
    console.error("Erro ao carregar contato:", error);
  }
}

async function saveStoreContact() {
  try {
    const payload = {
      phone: storePhoneInput?.value || "",
      email: storeEmailInput?.value || "",
      address: storeAddressInput?.value || "",
      displayHours: storeHoursInput?.value || ""
    };

    const response = await fetch(`${API_BASE}/api/store/contact`, {
      method: "PATCH",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao salvar contato.");
    }

    if (storePhoneInput) storePhoneInput.value = result.contact?.phone || "";
    if (storeEmailInput) storeEmailInput.value = result.contact?.email || "";
    if (storeAddressInput) storeAddressInput.value = result.contact?.address || "";
    if (storeHoursInput) storeHoursInput.value = result.contact?.displayHours || "";

    alert("Contato atualizado com sucesso!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao salvar contato.");
  }
}

async function enableSoundNotifications() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    soundEnabled = true;

    if (Notification && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (enableSoundBtn) {
      enableSoundBtn.textContent = "Som ativado";
      enableSoundBtn.disabled = true;
    }

    alert("Notificações ativadas!");
  } catch (error) {
    console.error("Erro ao ativar notificações:", error);
    alert("Não foi possível ativar o som de notificação.");
  }
}

function playNewOrderSound() {
  if (!soundEnabled || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.18);

  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.35, audioContext.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.55);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.6);
}

function showNewOrderNotification(order) {
  playNewOrderSound();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Novo pedido recebido!", {
      body: `Pedido ${order.id} - ${order.customer?.name || "Cliente"}`,
      icon: "../assets/images/logo.png"
    });
  }
}

function detectNewOrders(orders) {
  const currentIds = orders.map((order) => String(order.id));

  if (isFirstOrdersLoad) {
    currentIds.forEach((id) => knownOrderIds.add(id));
    saveOrderNotificationState();
    isFirstOrdersLoad = false;
    return;
  }

  const newOrders = orders.filter((order) => !knownOrderIds.has(String(order.id)));

  if (!newOrders.length) return;

  newOrders.forEach((order) => {
    const orderId = String(order.id);

    knownOrderIds.add(orderId);
    newOrderIds.add(orderId);
    showNewOrderNotification(order);
  });

  saveOrderNotificationState();
}

function markOrderAsSeen(orderId) {
  newOrderIds.delete(String(orderId));
  saveOrderNotificationState();
}

function resolveImagePath(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image;
  return `${API_BASE}/assets/images/${image}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function formatTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getElapsedMinutes(value) {
  if (!value) return 0;

  const createdAt = new Date(value).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((now - createdAt) / 60000));
}

function getElapsedText(value) {
  const minutes = getElapsedMinutes(value);

  if (minutes < 1) return "Agora mesmo";
  if (minutes === 1) return "Há 1 minuto";
  if (minutes < 60) return `Há ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 1 && remainingMinutes === 0) return "Há 1 hora";
  if (hours === 1) return `Há 1 hora e ${remainingMinutes} min`;

  if (remainingMinutes === 0) return `Há ${hours} horas`;

  return `Há ${hours} horas e ${remainingMinutes} min`;
}

function getOrderTimeClass(order) {
  if (order.status === "Finalizado") return "";

  const minutes = getElapsedMinutes(order.createdAt);

  if (minutes >= 40) return "order-late";
  if (minutes >= 25) return "order-warning";

  return "";
}

function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((button) => button.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

function resetMenuForm() {
  itemId.value = "";
  itemName.value = "";
  itemCategory.value = "";
  itemPrice.value = "";
  itemDescription.value = "";
  itemImageFile.value = "";
  currentImage.value = "";
  currentImageLabel.textContent = "Nenhuma imagem selecionada.";
  itemActive.checked = true;
  itemAvailable.checked = true;

  itemIsPromotion.checked = false;
  itemPromotionalPrice.value = "";
  itemPromotionLabel.value = "";
}

function showMenuForm(mode = "create") {
  if (!menuForm || !menuModalOverlay) {
    console.error("menuForm ou menuModalOverlay não encontrado.");
    return;
  }

  if (menuModalTitle) {
    menuModalTitle.textContent = mode === "edit" ? "Editar item" : "Novo item";
  }

  menuModalOverlay.classList.remove("hidden");
  menuForm.classList.remove("hidden");

  document.body.classList.add("modal-open");
}

function hideMenuForm() {
  if (!menuForm || !menuModalOverlay) return;

  menuModalOverlay.classList.add("hidden");
  menuForm.classList.add("hidden");

  document.body.classList.remove("modal-open");

  resetMenuForm();
}

function isToday(dateValue) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function renderDashboard(orders) {
  const todayOrders = orders.filter((order) => isToday(order.createdAt));

  const revenueToday = todayOrders.reduce(
    (total, order) => total + Number(order.subtotal || 0),
    0
  );

  const preparing = orders.filter((order) => order.status === "Em preparo").length;
  const finished = todayOrders.filter((order) => order.status === "Finalizado").length;

  if (dashboardOrdersToday) dashboardOrdersToday.textContent = todayOrders.length;
  if (dashboardRevenueToday) dashboardRevenueToday.textContent = formatCurrency(revenueToday);
  if (dashboardPreparing) dashboardPreparing.textContent = preparing;
  if (dashboardFinished) dashboardFinished.textContent = finished;
}

function getFilteredOrders() {
  const selectedStatus = orderStatusFilter?.value || "Todos";

  if (selectedStatus === "Todos") {
    return allOrders;
  }

  return allOrders.filter((order) => order.status === selectedStatus);
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone || "-";
}

function renderOrders(orders) {
  const filteredOrders = orders;

  if (!filteredOrders.length) {
    ordersList.innerHTML = `<p class="empty-message">Nenhum pedido encontrado.</p>`;
    return;
  }

  ordersList.innerHTML = filteredOrders
    .map((order) => {
      const itemsHtml = Array.isArray(order.items)
        ? order.items
            .map(
              (item) =>
                `<li>${item.quantity || 1}x ${item.name} - ${formatCurrency(item.price || 0)}</li>`
            )
            .join("")
        : "<li>Sem itens</li>";

      const isNewOrder = newOrderIds.has(String(order.id));
      const timeClass = typeof getOrderTimeClass === "function" ? getOrderTimeClass(order) : "";

      return `
        <div class="order-card ${isNewOrder ? "order-card-new" : ""} ${timeClass}">
          <div class="order-top">
            <div>
              <h3>
                Pedido de ${order.customer?.name || "Cliente"}
                <small>#${order.id}</small>
                ${isNewOrder ? `<span class="new-order-badge">NOVO PEDIDO 🔥</span>` : ""}
              </h3>

              ${
                typeof getElapsedText === "function"
                  ? `<p class="order-time-info">
                      <strong>${getElapsedText(order.createdAt)}</strong>
                      <span>Criado às ${formatTime(order.createdAt)}</span>
                    </p>`
                  : `<p class="order-meta"><strong>Criado em:</strong> ${formatDate(order.createdAt)}</p>`
              }

              <p class="order-meta"><strong>Cliente:</strong> ${order.customer?.name || "-"}</p>
              <p class="order-meta"><strong>Telefone:</strong> ${formatPhone(order.customer?.phone)}</p>
              <p class="order-meta">
  <strong>Endereço:</strong> 
  ${order.address?.street || "-"}, ${order.address?.number || "-"} - ${order.address?.district || "-"}
</p>

${
  order.address?.city || order.address?.state
    ? `<p class="order-meta"><strong>Cidade:</strong> ${order.address?.city || "-"}${order.address?.state ? `/${order.address.state}` : ""}</p>`
    : ""
}

${
  order.address?.complement
    ? `<p class="order-meta"><strong>Complemento:</strong> ${order.address.complement}</p>`
    : ""
}

${
  order.address?.reference
    ? `<p class="order-meta"><strong>Referência:</strong> ${order.address.reference}</p>`
    : ""
}
              <p class="order-meta"><strong>Pagamento:</strong> ${order.payment?.method || "-"}</p>

              ${
                String(order.payment?.method || "").toLowerCase() === "dinheiro" &&
                order.payment?.changeFor
                  ? `<p class="order-meta"><strong>Troco para:</strong> ${formatCurrency(order.payment.changeFor)}</p>`
                  : ""
              }

              <p class="order-meta"><strong>Total:</strong> ${formatCurrency(order.subtotal || 0)}</p>

${
  order.notes || order.customerNotes
    ? `<p class="order-meta"><strong>Observações:</strong> ${order.notes || order.customerNotes}</p>`
    : ""
}

<p class="order-meta"><strong>Status atual:</strong> ${order.status || "Recebido"}</p>
            </div>
          </div>

          <div>
            <strong>Itens:</strong>
            <ul class="order-items">
              ${itemsHtml}
            </ul>
          </div>

          <div class="order-actions">
            <select onchange="updateOrderStatus('${order.id}', this.value)">
              ${orderStatuses
                .map(
                  (status) =>
                    `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadOrders() {
  try {
    ordersList.innerHTML = `<p class="empty-message">Carregando pedidos...</p>`;

    const response = await fetch(`${API_BASE}/api/orders`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar pedidos.");
    }

    const orders = Array.isArray(result.orders) ? result.orders : [];

    detectNewOrders(orders);

    allOrders = orders;
    renderDashboard(allOrders);
    renderOrders(getFilteredOrders());
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
    ordersList.innerHTML = `<p class="empty-message">Erro ao carregar pedidos.</p>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao atualizar status.");
    }

    markOrderAsSeen(orderId);
    await loadOrders();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao atualizar status do pedido.");
  }
}

function renderPanelMenu() {
  const search = panelMenuSearchTerm.toLowerCase().trim();

  const filteredItems = allMenuItems.filter((item) => {
    return (
      !search ||
      item.name?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  });

  if (!filteredItems.length) {
    menuList.innerHTML = `<p class="empty-message">Nenhum item encontrado.</p>`;
    return;
  }

  menuList.innerHTML = filteredItems
    .map((item) => {
      const imageUrl = resolveImagePath(item.image);

      return `
        <div class="menu-card">
          <div class="menu-top">
            <div>
              <h3>${item.name}</h3>
              <p class="menu-meta"><strong>Categoria:</strong> ${item.category}</p>
              <p class="menu-meta"><strong>Preço:</strong> ${formatCurrency(item.price)}</p>

              ${
                item.isPromotion
                  ? `<p class="menu-meta promo-admin-line">
                      <strong>Promoção:</strong> 
                      ${item.promotionalPrice ? formatCurrency(item.promotionalPrice) : "Sem preço promocional"}
                      ${item.promotionLabel ? ` - ${item.promotionLabel}` : ""}
                    </p>`
                  : ""
              }

              <p class="menu-meta"><strong>Descrição:</strong> ${item.description}</p>
              <p class="menu-meta"><strong>Imagem:</strong> ${item.image || "Sem imagem"}</p>

              ${
                imageUrl
                  ? `<img src="${imageUrl}" alt="${item.name}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;margin-top:10px;">`
                  : ""
              }
            </div>

            <div>
              <span class="badge ${item.active ? "active" : "inactive"}">
                ${item.active ? "Ativo" : "Inativo"}
              </span>
              <br /><br />
              <span class="badge ${item.available ? "available" : "unavailable"}">
                ${item.available ? "Disponível" : "Indisponível"}
              </span>
            </div>
          </div>

          <div class="menu-actions">
            <button onclick="editMenuItem(${item.id})">Editar</button>
            <button onclick="toggleItemActive(${item.id})">
              ${item.active ? "Desativar" : "Ativar"}
            </button>
            <button onclick="toggleItemAvailable(${item.id})">
              ${item.available ? "Marcar indisponível" : "Marcar disponível"}
            </button>
            <button class="delete-btn" onclick="deleteMenuItem(${item.id})">
              Excluir
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadMenu() {
  try {
    menuList.innerHTML = `<p class="empty-message">Carregando itens do cardápio...</p>`;

    const response = await fetch(`${API_BASE}/api/menu?admin=true`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar cardápio.");
    }

    const items = Array.isArray(result.items) ? result.items : [];

    allMenuItems = items;
    renderPanelMenu();
  } catch (error) {
    console.error("Erro ao carregar cardápio:", error);
    menuList.innerHTML = `<p class="empty-message">Erro ao carregar cardápio.</p>`;
  }
}

async function editMenuItem(id) {
  try {
    const response = await fetch(`${API_BASE}/api/menu/${id}`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao buscar item.");
    }

    const item = result.item;

    itemId.value = item.id;
    itemName.value = item.name || "";
    itemCategory.value = item.category || "";
    itemPrice.value = item.price || "";
    itemIsPromotion.checked = !!item.isPromotion;
itemPromotionalPrice.value = item.promotionalPrice || "";
itemPromotionLabel.value = item.promotionLabel || "";
    itemDescription.value = item.description || "";
    itemActive.checked = !!item.active;
    itemAvailable.checked = !!item.available;
    currentImage.value = item.image || "";
    itemImageFile.value = "";
    currentImageLabel.textContent = item.image
      ? `Imagem atual: ${item.image}`
      : "Nenhuma imagem selecionada.";

    showMenuForm("edit");
    document.querySelector('[data-tab="cardapio"]').click();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao carregar item para edição.");
  }
}

async function toggleItemActive(id) {
  try {
    const response = await fetch(`${API_BASE}/api/menu/${id}/toggle-active`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao alterar status do item.");
    }

    await loadMenu();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao ativar/desativar item.");
  }
}

async function toggleItemAvailable(id) {
  try {
    const response = await fetch(`${API_BASE}/api/menu/${id}/toggle-available`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao alterar disponibilidade.");
    }

    await loadMenu();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao alterar disponibilidade do item.");
  }
}

async function saveMenuItem(event) {
  event.preventDefault();

  if (
    !itemName.value.trim() ||
    !itemCategory.value.trim() ||
    !itemDescription.value.trim() ||
    Number.isNaN(Number(itemPrice.value))
  ) {
    alert("Preencha nome, categoria, descrição e preço corretamente.");
    return;
  }

  const formData = new FormData();
  formData.append("name", itemName.value.trim());
  formData.append("category", itemCategory.value.trim());
  formData.append("price", itemPrice.value);
  formData.append("isPromotion", String(itemIsPromotion.checked));
formData.append("promotionalPrice", itemPromotionalPrice.value || "");
formData.append("promotionLabel", itemPromotionLabel.value.trim());
  formData.append("description", itemDescription.value.trim());
  formData.append("active", String(itemActive.checked));
  formData.append("available", String(itemAvailable.checked));
  formData.append("currentImage", currentImage.value || "");

  if (itemImageFile.files[0]) {
    formData.append("imageFile", itemImageFile.files[0]);
  }

  const isEditing = Boolean(itemId.value);
  const url = isEditing
    ? `${API_BASE}/api/menu/${itemId.value}`
    : `${API_BASE}/api/menu`;

  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao salvar item do cardápio.");
    }

    hideMenuForm();
    await loadMenu();
    alert(isEditing ? "Item atualizado com sucesso!" : "Item criado com sucesso!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao salvar item do cardápio.");
  }
}

if (newItemBtn) {
  newItemBtn.addEventListener("click", () => {
    resetMenuForm();
    showMenuForm("create");
  });
}

cancelFormBtn.addEventListener("click", hideMenuForm);

itemImageFile.addEventListener("change", () => {
  const file = itemImageFile.files[0];
  currentImageLabel.textContent = file
    ? `Nova imagem: ${file.name}`
    : currentImage.value
      ? `Imagem atual: ${currentImage.value}`
      : "Nenhuma imagem selecionada.";
});

if (enableSoundBtn) {
  enableSoundBtn.addEventListener("click", enableSoundNotifications);
}

if (orderStatusFilter) {
  orderStatusFilter.addEventListener("change", () => {
    renderOrders(getFilteredOrders());
  });
}

if (toggleStoreBtn) {
  toggleStoreBtn.addEventListener("click", toggleStoreStatus);
}

if (refreshReviewsBtn) {
  refreshReviewsBtn.addEventListener("click", loadReviews);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "./login.html";
  });
}

if (closeMenuModalBtn) {
  closeMenuModalBtn.addEventListener("click", hideMenuForm);
}

if (menuModalOverlay) {
  menuModalOverlay.addEventListener("click", (event) => {
    if (event.target === menuModalOverlay) {
      hideMenuForm();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuModalOverlay && !menuModalOverlay.classList.contains("hidden")) {
    hideMenuForm();
  }
});

async function loadStoreStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/store/status`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar status da loja.");
    }

    storeIsOpen = Boolean(result.isOpen);
    autoScheduleEnabled = Boolean(result.autoScheduleEnabled);

    if (openTimeInput) {
      openTimeInput.value = result.schedule?.openTime || "18:00";
    }

    if (closeTimeInput) {
      closeTimeInput.value = result.schedule?.closeTime || "23:30";
    }

    updateStoreButton();
    updateScheduleButton();
  } catch (error) {
    console.error("Erro ao carregar status da loja:", error);

    if (toggleStoreBtn) {
      toggleStoreBtn.textContent = "Erro status loja";
    }
  }
}

function updateStoreButton() {
  if (!toggleStoreBtn) return;

  toggleStoreBtn.textContent = storeIsOpen ? "Loja aberta" : "Loja fechada";
  toggleStoreBtn.classList.toggle("store-open", storeIsOpen);
  toggleStoreBtn.classList.toggle("store-closed", !storeIsOpen);
}

function updateScheduleButton() {
  if (!toggleScheduleBtn) return;

  toggleScheduleBtn.textContent = autoScheduleEnabled
    ? "Desativar automação"
    : "Ativar automação";

  toggleScheduleBtn.classList.toggle("store-open", autoScheduleEnabled);
  toggleScheduleBtn.classList.toggle("store-closed", !autoScheduleEnabled);
}

async function saveStoreSchedule() {
  try {
    const response = await fetch(`${API_BASE}/api/store/schedule`, {
      method: "PATCH",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        autoScheduleEnabled,
        openTime: openTimeInput?.value || "18:00",
        closeTime: closeTimeInput?.value || "23:30"
      })
    });

    const text = await response.text();

let result;

try {
  result = JSON.parse(text);
} catch {
  throw new Error("A rota /api/store/schedule não respondeu JSON. Confira se o backend foi reiniciado e se a rota existe.");
}

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao salvar horário.");
    }

    storeIsOpen = Boolean(result.isOpen);
    autoScheduleEnabled = Boolean(result.autoScheduleEnabled);

    updateStoreButton();
    updateScheduleButton();

    await loadStoreContact();

    alert("Horário salvo com sucesso!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao salvar horário.");
  }
}

async function toggleScheduleAutomation() {
  autoScheduleEnabled = !autoScheduleEnabled;
  await saveStoreSchedule();
}

function formatPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

async function toggleStoreStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/store/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isOpen: !storeIsOpen
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao alterar status da loja.");
    }

    storeIsOpen = Boolean(result.isOpen);
    updateStoreButton();

    alert(storeIsOpen ? "Loja aberta para pedidos!" : "Loja fechada para pedidos!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao alterar status da loja.");
  }
}

function renderStars(rating) {
  const value = Number(rating || 0);
  return "⭐".repeat(value) + "☆".repeat(5 - value);
}

async function loadReviews() {
  try {
    if (!reviewsList) return;

    reviewsList.innerHTML = `<p class="empty-message">Carregando avaliações...</p>`;

    const response = await fetch(`${API_BASE}/api/store/reviews`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar avaliações.");
    }

    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

    if (reviewsTotal) reviewsTotal.textContent = reviews.length;

    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

    if (reviewsAverage) reviewsAverage.textContent = `${average.toFixed(1)} ⭐`;

    if (!reviews.length) {
      reviewsList.innerHTML = `<p class="empty-message">Nenhuma avaliação recebida ainda.</p>`;
      return;
    }

    reviewsList.innerHTML = reviews
      .slice()
      .reverse()
      .map(
        (review) => `
          <div class="review-card">
            <div>
              <h3>
  ${
  review.customerName
    ? `Pedido de ${review.customerName}`
    : `Pedido ${review.orderId}`
}
</h3>
              <p class="review-stars">${renderStars(review.rating)}</p>
              <p class="review-comment">${review.comment || "Sem comentário."}</p>
              <p class="order-meta"><strong>Data:</strong> ${formatDate(review.createdAt)}</p>
            </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Erro ao carregar avaliações:", error);
    reviewsList.innerHTML = `<p class="empty-message">Erro ao carregar avaliações.</p>`;
  }
}

if (storePhoneInput) {
  storePhoneInput.addEventListener("input", () => {
    storePhoneInput.value = formatPhoneInput(storePhoneInput.value);
  });
}

async function deleteMenuItem(id) {
  const confirmDelete = confirm(
    "Tem certeza que deseja excluir este item do cardápio? Essa ação não pode ser desfeita."
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE}/api/menu/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao excluir item.");
    }

    await loadMenu();
    alert("Item excluído com sucesso!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao excluir item.");
  }
}

if (panelMenuSearchInput) {
  panelMenuSearchInput.addEventListener("input", () => {
    panelMenuSearchTerm = panelMenuSearchInput.value;
    renderPanelMenu();
  });
}

if (saveScheduleBtn) {
  saveScheduleBtn.addEventListener("click", saveStoreSchedule);
}

if (toggleScheduleBtn) {
  toggleScheduleBtn.addEventListener("click", toggleScheduleAutomation);
}

if (saveContactBtn) {
  saveContactBtn.addEventListener("click", saveStoreContact);
}

refreshOrdersBtn.addEventListener("click", loadOrders);
refreshMenuBtn.addEventListener("click", loadMenu);

refreshAllBtn.addEventListener("click", async () => {
  await loadOrders();
  await loadMenu();
});

menuForm.addEventListener("submit", saveMenuItem);

setupTabs();
loadOrders();
loadMenu();
loadStoreStatus();
loadReviews();
loadStoreContact();

setInterval(loadOrders, 10000);
setInterval(loadOrders, 60000);

window.updateOrderStatus = updateOrderStatus;
window.editMenuItem = editMenuItem;
window.toggleItemActive = toggleItemActive;
window.toggleItemAvailable = toggleItemAvailable;
window.deleteMenuItem = deleteMenuItem;