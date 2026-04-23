function normalizeBrazilPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");

  // Remove código do país se já tiver
  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  if (digits.length < 10 || digits.length > 11) {
    throw new Error("Número inválido. Use DDD + número.");
  }

  const ddd = digits.slice(0, 2);
  let number = digits.slice(2);

  // Adiciona 9 se faltar (celular antigo)
  if (number.length === 8) {
    number = `9${number}`;
  }

  if (number.length !== 9) {
    throw new Error("Número de celular inválido.");
  }

  return `55${ddd}${number}`;
}

export async function sendWhatsAppMessage(to, message) {
  try {
    const normalizedNumber = normalizeBrazilPhone(to);

    const baseUrl = process.env.EVOLUTION_API_URL;
    const instance = process.env.EVOLUTION_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;

    console.log("Base URL:", baseUrl);
    console.log("Instância:", instance);
    console.log("Número normalizado:", normalizedNumber);

    const url = `${baseUrl}/message/sendText/${instance}`;
    console.log("URL chamada:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey
      },
      body: JSON.stringify({
        number: normalizedNumber,
        text: message
      })
    });

    const data = await response.json();

    console.log("Resposta Evolution:", data);

    if (!response.ok) {
      return { error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro Evolution:", error);
    return { error: error.message };
  }
}