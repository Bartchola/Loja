const API_BASE = "http://localhost:3001";

const reviewForm = document.getElementById("reviewForm");
const orderIdInput = document.getElementById("orderId");
const ratingInput = document.getElementById("rating");
const commentInput = document.getElementById("comment");
const customerNameInput = document.getElementById("customerName");

const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

if (orderIdInput) {
  orderIdInput.value = orderId || "";
}

if (!orderId) {
  alert("Pedido não identificado. Abra o link enviado pelo WhatsApp.");
}

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!orderIdInput.value) {
      alert("Pedido não identificado.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/store/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: orderIdInput.value,
          customerName: customerNameInput?.value?.trim() || "Cliente",
          rating: ratingInput.value,
          comment: commentInput.value.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Erro ao enviar avaliação.");
      }

      reviewForm.innerHTML = `
        <p class="empty-message">
          Avaliação enviada com sucesso. Obrigado!
        </p>
      `;
    } catch (error) {
      alert(error.message || "Erro ao enviar avaliação.");
    }
  });
}