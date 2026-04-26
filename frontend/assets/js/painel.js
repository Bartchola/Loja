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

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const refreshMenuBtn = document.getElementById("refreshMenuBtn");
const refreshAllBtn = document.getElementById("refreshAllBtn");
const enableSoundBtn = document.getElementById("enableSoundBtn");
const newItemBtn = document.getElementById("newItemBtn");
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
const cancelFormBtn = document.getElementById("cancelFormBtn");

const itemId = document.getElementById("itemId");
const itemName = document.getElementById("itemName");
const itemCategory = document.getElementById("itemCategory");
const itemPrice = document.getElementById("itemPrice");
const itemImageFile = document.getElementById("itemImageFile");
const currentImage = document.getElementById("currentImage");
const currentImageLabel = document.getElementById("currentImageLabel");
const itemDescription = document.getElementById("itemDescription");
const itemActive = document.getElementById("itemActive");
const itemAvailable = document.getElementById("itemAvailable");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const logoutBtn = document.getElementById("logoutBtn");

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
}

function showMenuForm() {
  menuForm.classList.remove("hidden");
}

function hideMenuForm() {
  menuForm.classList.add("hidden");
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
                Pedido ${order.id}
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
              <p class="order-meta"><strong>Telefone:</strong> ${order.customer?.phone || "-"}</p>
              <p class="order-meta"><strong>Endereço:</strong> ${order.address?.street || "-"}, ${order.address?.number || "-"} - ${order.address?.district || "-"}</p>
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

    if (!items.length) {
      menuList.innerHTML = `<p class="empty-message">Nenhum item cadastrado no cardápio.</p>`;
      return;
    }

    menuList.innerHTML = items
      .map((item) => {
        const imageUrl = resolveImagePath(item.image);

        return `
          <div class="menu-card">
            <div class="menu-top">
              <div>
                <h3>${item.name}</h3>
                <p class="menu-meta"><strong>Categoria:</strong> ${item.category}</p>
                <p class="menu-meta"><strong>Preço:</strong> ${formatCurrency(item.price)}</p>
                <p class="menu-meta"><strong>Descrição:</strong> ${item.description}</p>
                <p class="menu-meta"><strong>Imagem:</strong> ${item.image || "Sem imagem"}</p>
                ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;margin-top:10px;">` : ""}
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
    itemDescription.value = item.description || "";
    itemActive.checked = !!item.active;
    itemAvailable.checked = !!item.available;
    currentImage.value = item.image || "";
    itemImageFile.value = "";
    currentImageLabel.textContent = item.image
      ? `Imagem atual: ${item.image}`
      : "Nenhuma imagem selecionada.";

    showMenuForm();
    document.querySelector('[data-tab="cardapio"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
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

newItemBtn.addEventListener("click", () => {
  resetMenuForm();
  showMenuForm();
});

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

async function loadStoreStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/store/status`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar status da loja.");
    }

    storeIsOpen = Boolean(result.isOpen);
    updateStoreButton();
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
              <h3>Pedido ${review.orderId}</h3>
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

setInterval(loadOrders, 10000);
setInterval(loadOrders, 60000);

window.updateOrderStatus = updateOrderStatus;
window.editMenuItem = editMenuItem;
window.toggleItemActive = toggleItemActive;
window.toggleItemAvailable = toggleItemAvailable;
window.deleteMenuItem = deleteMenuItem;