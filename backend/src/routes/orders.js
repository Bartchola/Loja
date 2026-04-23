import express from "express";
import { sendWhatsAppMessage } from "../services/evolution.js";

const router = express.Router();

const orders = [];

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

router.patch("/:id/status", (req, res) => {
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

  const order = orders.find((item) => item.id === id);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Pedido não encontrado."
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  return res.json({
    ok: true,
    order
  });
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

    const customerPhone = normalizePhone(order.customer.phone);

    const savedOrder = {
      id: `PED-${Date.now()}`,
      customer: {
        ...order.customer,
        phone: customerPhone
      },
      address: order.address,
      payment: order.payment,
      notes: order.notes || "",
      items: order.items,
      subtotal: order.subtotal,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      status: "Recebido"
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