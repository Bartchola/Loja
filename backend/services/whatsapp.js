function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildItemsText(items) {
  return items
    .map((item) => {
      const total = Number(item.price) * Number(item.quantity);
      return `${item.name} x${item.quantity} - ${formatCurrency(total)}`;
    })
    .join(", ");
}

export async function sendWhatsAppTemplate(order) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "pedido_confirmado";
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR";

  if (!accessToken || !phoneNumberId) {
    return {
      sent: false,
      reason: "Credenciais do WhatsApp não configuradas."
    };
  }

  const body = {
    messaging_product: "whatsapp",
    to: order.customer.phone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: templateLanguage
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: order.customer.name },
            {
              type: "text",
              text: buildItemsText(order.items).slice(0, 1024)
            },
            {
              type: "text",
              text: formatCurrency(order.subtotal)
            },
            {
              type: "text",
              text: `${order.address.street}, ${order.address.number} - ${order.address.district}`
            },
            {
              type: "text",
              text: order.payment.method
            }
          ]
        }
      ]
    }
  };

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro WhatsApp:", data);

    return {
      sent: false,
      error: data
    };
  }

  return {
    sent: true,
    data
  };
}