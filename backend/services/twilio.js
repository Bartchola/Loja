import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Credenciais da Twilio não carregadas corretamente.");
  }

  return twilio(accountSid, authToken);
}

export async function sendWhatsAppMessage(to, message) {
  try {
    const client = getTwilioClient();

    const cleanNumber = String(to).replace(/\D/g, "");
    const formattedTo = `whatsapp:+${cleanNumber}`;
    const formattedFrom = process.env.TWILIO_WHATSAPP_FROM;

    console.log("Enviando de:", formattedFrom);
    console.log("Enviando para:", formattedTo);

    const response = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message
    });

    console.log("Twilio SID:", response.sid);
    console.log("Twilio status:", response.status);

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("Erro Twilio completo:");
    console.error("message:", error.message);
    console.error("code:", error.code);
    console.error("status:", error.status);
    console.error("moreInfo:", error.moreInfo);

    return {
      success: false,
      error
    };
  }
}