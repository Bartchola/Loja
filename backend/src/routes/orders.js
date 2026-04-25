import express from "express";
import { sendWhatsAppMessage } from "../services/evolution.js";

const router = express.Router();

const orders = [];

const ENABLE_STATUS_MESSAGE_HISTORY = true;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function validateOrder(order) {
  const errors = [];

  if (!order || typeof order !== "object") {
    return ["Pedido inválido."];
  }

  if (!order.customer || !isNonEmptyString(order.customer.name)) {
    errors.push("Nome do cliente é obrigatório.");
  }

  if (!order.customer || !isNonEmptyString(order.customer.phone)) {
    errors.push("WhatsApp do cliente é obrigatório.");
  }

  if (!order.address || !isNonEmptyString(order.address.street) || order.address.street.trim().length < 5) {
    errors.push("Endereço inválido.");
  }

  if (!order.address || !isNonEmptyString(order.address.number)) {
    errors.push("Número do endereço é obrigatório.");
  }

  if (!order.address || !/^\d+$/.test(String(order.address.number).trim())) {
    errors.push("Número do endereço deve conter apenas números.");
  }

  if (!order.address || !isNonEmptyString(order.address.district) || order.address.district.trim().length < 3) {
    errors.push("Bairro inválido.");
  }

  if (!order.payment || !isNonEmptyString(order.payment.method)) {
    errors.push("Forma de pagamento é obrigatória.");
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push("O pedido precisa ter pelo menos um item.");
  }

  return errors;
}

router.get("/", (_req, res) => {
  return res.json({
    ok: true,
    orders: [...orders].reverse()
  });
});

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getOrderItemsText(order) {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return "Nenhum item informado.";
  }

  return order.items
    .map((item) => {
      const quantity = item.quantity || 1;
      const name = item.name || "Item";
      const price = Number(item.price || 0);
      const total = quantity * price;

      return `• ${quantity}x ${name} - ${formatCurrency(total)}`;
    })
    .join("\n");
}

function getOrderAddressText(order) {
  const address = order.address || {};

  const street = address.street || "";
  const number = address.number || "";
  const district = address.district || "";
  const city = address.city || "";
  const state = address.state || "";
  const complement = address.complement || "";
  const reference = address.reference || "";

  let text = `${street}, ${number}`;

  if (district) text += ` - ${district}`;
  if (city || state) text += ` - ${city}/${state}`;
  if (complement) text += `\nComplemento: ${complement}`;
  if (reference) text += `\nReferência: ${reference}`;

  return text.trim();
}

function getStatusMessage(order, status) {
  const customerName = order.customer?.name || "cliente";
  const orderId = order.id || "";
  const subtotal = order.subtotal || order.total || 0;
  const paymentMethod = order.payment?.method || order.paymentMethod || "Não informado";

  const messages = {
    "Recebido": `Olá, ${customerName}! ✅

Seu pedido #${orderId} foi confirmado com sucesso.

📦 *Itens do pedido:*
${getOrderItemsText(order)}

📍 *Endereço de entrega:*
${getOrderAddressText(order)}

💳 *Pagamento:*
${paymentMethod}

💰 *Total:*
${formatCurrency(subtotal)}

Já recebemos seu pedido e em breve ele será preparado. Obrigado pela preferência!`,

    "Em preparo": `Olá, ${customerName}! 👨‍🍳

Seu pedido #${orderId} está em preparo.

Nossa equipe já começou a preparar tudo com cuidado para você.`,

    "Saiu para entrega": `Olá, ${customerName}! 🛵

Seu pedido #${orderId} saiu para entrega.

Fique atento ao telefone e ao endereço informado. Ele chegará em breve!`,

    "Pronto para retirada": `Olá, ${customerName}! 📦

Seu pedido #${orderId} está pronto para retirada.

Você já pode vir buscar no local combinado. Obrigado pela preferência!`,

    "Finalizado": `Olá, ${customerName}! ⭐

Seu pedido #${orderId} foi finalizado.

Esperamos que tenha gostado! Se puder, avalie seu pedido pelo link abaixo:

http://localhost:3001/pages/avaliar.html?orderId=${orderId}

Sua opinião ajuda muito!`
  };

  return messages[status] || null;
}

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Recebido",
      "Em preparo",
      "Saiu para entrega",
      "Pronto para retirada",
      "Finalizado"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Status inválido."
      });
    }

    const order = orders.find((item) => String(item.id) === String(id));

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Pedido não encontrado."
      });
    }

    if (!Array.isArray(order.statusMessagesSent)) {
      order.statusMessagesSent = [];
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    const alreadySent = order.statusMessagesSent.includes(status);
    const shouldSendMessage = !ENABLE_STATUS_MESSAGE_HISTORY || !alreadySent;

    const phone = order.customer?.phone;
    const message = getStatusMessage(order, status);

    let whatsappSent = false;
    let whatsappSkipped = false;

    if (phone && message && shouldSendMessage) {
      try {
        await sendWhatsAppMessage(phone, message);
        whatsappSent = true;

        if (ENABLE_STATUS_MESSAGE_HISTORY) {
          order.statusMessagesSent.push(status);
        }
      } catch (whatsappError) {
        console.error("Erro ao enviar mensagem de status:", whatsappError.message);
      }
    } else if (phone && message && !shouldSendMessage) {
      whatsappSkipped = true;
    }

    return res.json({
      ok: true,
      message: "Status atualizado com sucesso.",
      whatsappSent,
      whatsappSkipped,
      historyEnabled: ENABLE_STATUS_MESSAGE_HISTORY,
      order
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);

    return res.status(500).json({
      ok: false,
      message: "Erro ao atualizar status do pedido."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const order = req.body;
    const errors = validateOrder(order);

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        errors
      });
    }

    const {
  customer,
  address,
  payment = {},
  items,
  subtotal,
  notes
} = req.body;

    const customerPhone = normalizePhone(order.customer.phone);

    const savedOrder = {
      id: `PED-${Date.now()}`,
      customer: {
        ...order.customer,
        phone: customerPhone
      },
      address: order.address,
      payment: {
        method: payment?.method || "",
        changeFor: payment?.changeFor || ""
      },
      notes: order.notes || "",
      items: order.items,
      subtotal: order.subtotal,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      statusMessagesSent: ["Recebido"]
    };

    orders.push(savedOrder);

    const message = `Pedido confirmado 🍗

Cliente: ${savedOrder.customer.name}

Itens:
${savedOrder.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n")}

Total: R$ ${Number(savedOrder.subtotal).toFixed(2)}

Endereço:
${savedOrder.address.street}, ${savedOrder.address.number} - ${savedOrder.address.district}

Pagamento: ${savedOrder.payment.method}
`;

    const whatsappResult = await sendWhatsAppMessage(
      savedOrder.customer.phone,
      message
    );

    console.log("Resultado Evolution:", whatsappResult);

    if (whatsappResult?.error) {
      return res.status(500).json({
        ok: false,
        message: "Falha ao enviar mensagem no WhatsApp.",
        error: whatsappResult.error
      });
    }

    return res.status(201).json({
      ok: true,
      order: savedOrder,
      whatsapp: whatsappResult
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    return res.status(500).json({
      ok: false,
      message: "Erro interno ao processar o pedido."
    });
  }
});

export default router;