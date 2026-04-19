const ordersList = document.querySelector("#ordersList");
const refreshOrdersBtn = document.querySelector("#refreshOrdersBtn");

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR");
}

function renderOrders(orders) {
  if (!ordersList) return;

  if (!orders.length) {
    ordersList.innerHTML = `<p class="orders-empty">Nenhum pedido encontrado.</p>`;
    return;
  }

  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-card-top">
        <div>
          <h2>${order.customer.name}</h2>
          <p class="order-meta">Pedido: ${order.id}</p>
          <p class="order-meta">Criado em: ${formatDate(order.createdAt)}</p>
        </div>

        <span class="order-status">${order.status}</span>
      </div>

      <div class="order-block">
        <strong>Contato</strong>
        <p>${order.customer.phone}</p>
      </div>

      <div class="order-block">
        <strong>Endereço</strong>
        <p>${order.address.street}, ${order.address.number} - ${order.address.district}</p>
      </div>

      <div class="order-block">
        <strong>Itens</strong>
        <ul class="order-items">
          ${order.items.map((item) => `<li>${item.name} x${item.quantity}</li>`).join("")}
        </ul>
      </div>

      <div class="order-block">
        <strong>Pagamento</strong>
        <p>${order.payment.method}</p>
      </div>

      <div class="order-footer">
        <span class="order-total">${formatPrice(order.subtotal)}</span>

        <div class="status-actions">
          <button class="status-btn" data-order-id="${order.id}" data-status="Recebido">Recebido</button>
          <button class="status-btn" data-order-id="${order.id}" data-status="Em preparo">Em preparo</button>
          <button class="status-btn" data-order-id="${order.id}" data-status="Saiu para entrega">Saiu para entrega</button>
          <button class="status-btn" data-order-id="${order.id}" data-status="Pronto para retirada">Pronto para retirada</button>
          <button class="status-btn" data-order-id="${order.id}" data-status="Finalizado">Finalizado</button>
        </div>
      </div>
    </article>
  `).join("");

  ordersList.querySelectorAll("[data-order-id][data-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.getAttribute("data-order-id");
      const status = button.getAttribute("data-status");

      await updateOrderStatus(orderId, status);
    });
  });
}

async function fetchOrders() {
  try {
    const response = await fetch("http://localhost:3001/api/orders");
    const result = await response.json();

    if (!response.ok) {
      alert(result?.message || "Erro ao carregar pedidos.");
      return;
    }

    renderOrders(result.orders || []);
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result?.message || "Erro ao atualizar status.");
      return;
    }

    await fetchOrders();
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
  }
}

if (refreshOrdersBtn) {
  refreshOrdersBtn.addEventListener("click", fetchOrders);
}

fetchOrders();