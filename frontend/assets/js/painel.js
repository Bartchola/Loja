const API_BASE = "http://localhost:3001";

const ordersList = document.getElementById("ordersList");
const menuList = document.getElementById("menuList");

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const refreshMenuBtn = document.getElementById("refreshMenuBtn");
const refreshAllBtn = document.getElementById("refreshAllBtn");
const newItemBtn = document.getElementById("newItemBtn");

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

const orderStatuses = [
  "Recebido",
  "Em preparo",
  "Saiu para entrega",
  "Pronto para retirada",
  "Finalizado"
];

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

async function loadOrders() {
  try {
    ordersList.innerHTML = `<p class="empty-message">Carregando pedidos...</p>`;

    const response = await fetch(`${API_BASE}/api/orders`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao carregar pedidos.");
    }

    const orders = Array.isArray(result.orders) ? result.orders : [];

    if (!orders.length) {
      ordersList.innerHTML = `<p class="empty-message">Nenhum pedido encontrado.</p>`;
      return;
    }

    ordersList.innerHTML = orders
      .map((order) => {
        const itemsHtml = Array.isArray(order.items)
          ? order.items
              .map(
                (item) =>
                  `<li>${item.quantity || 1}x ${item.name} - ${formatCurrency(item.price || 0)}</li>`
              )
              .join("")
          : "<li>Sem itens</li>";

        return `
          <div class="order-card">
            <div class="order-top">
              <div>
                <h3>Pedido ${order.id}</h3>
                <p class="order-meta"><strong>Cliente:</strong> ${order.customer?.name || "-"}</p>
                <p class="order-meta"><strong>Telefone:</strong> ${order.customer?.phone || "-"}</p>
                <p class="order-meta"><strong>Criado em:</strong> ${formatDate(order.createdAt)}</p>
                <p class="order-meta"><strong>Endereço:</strong> ${order.address?.street || "-"}, ${order.address?.number || "-"} - ${order.address?.district || "-"}</p>
                <p class="order-meta"><strong>Pagamento:</strong> ${order.payment?.method || "-"}</p>
                <p class="order-meta"><strong>Total:</strong> ${formatCurrency(order.subtotal || 0)}</p>
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

    await loadOrders();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao atualizar status do pedido.");
  }
}

async function loadMenu() {
  try {
    menuList.innerHTML = `<p class="empty-message">Carregando itens do cardápio...</p>`;

    const response = await fetch(`${API_BASE}/api/menu?admin=true`);
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
    const response = await fetch(`${API_BASE}/api/menu/${id}`);
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
      method: "PATCH"
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
      method: "PATCH"
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

window.updateOrderStatus = updateOrderStatus;
window.editMenuItem = editMenuItem;
window.toggleItemActive = toggleItemActive;
window.toggleItemAvailable = toggleItemAvailable;