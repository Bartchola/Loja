export async function sendWhatsAppMessage(to, message) {
  try {
    const response = await fetch("http://localhost:8083/message/sendText/Teste", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "429683C4C977415CAAFCCE10F7D57E11"
      },
      body: JSON.stringify({
        number: 5551995043467,
        text: "teste evolution"
      })
    });

    const data = await response.json();

    console.log("Resposta Evolution:", data);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Erro Evolution:", error);

    return {
      success: false,
      error
    };
  }
}