import express from "express";
import { sendWhatsAppMessage } from "../services/twilio.js";

const router = express.Router();

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

  if (!order.address || !isNonEmptyString(order.address.street)) {
    errors.push("Rua é obrigatória.");
  }

  if (!order.address || !isNonEmptyString(order.address.number)) {
    errors.push("Número é obrigatório.");
  }

  if (!order.address || !isNonEmptyString(order.address.district)) {
    errors.push("Bairro é obrigatório.");
  }

  if (!order.payment || !isNonEmptyString(order.payment.method)) {
    errors.push("Forma de pagamento é obrigatória.");
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push("O pedido precisa ter pelo menos um item.");
  }

  return errors;
}

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
      status: "confirmed"
    };

    console.log("Número enviado:", savedOrder.customer.phone);

    // Aqui depois tu pode salvar em banco.
    console.log("Pedido recebido:", JSON.stringify(savedOrder, null, 2));

    // Integração com WhatsApp
    const message = `
Pedido confirmado 🍗

Cliente: ${savedOrder.customer.name}

Itens:
${savedOrder.items.map(i => `- ${i.name} x${i.quantity}`).join("\n")}

Total: R$ ${savedOrder.subtotal}

Endereço:
${savedOrder.address.street}, ${savedOrder.address.number}

Pagamento: ${savedOrder.payment.method}
`;

const whatsappResult = await sendWhatsAppMessage(
  savedOrder.customer.phone,
  message
);

await sendWhatsAppMessage("5551995043467", "teste direto");

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

//só para dar commit mesmo, não tem nada de novo aqui, só pra atualizar o token da twilio que tava dando erro de autenticação.