import axios from 'axios';

export const sendOrderConfirmation = async (phone, total) => {
    try {
        // Limpa o número para o padrão da Evolution API
        const cleanNumber = phone.replace(/\D/g, '');
        const finalNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

        const url = `${process.env.EVO_URL}/message/sendText/${process.env.EVO_INSTANCE}`;
        
        await axios.post(url, {
            number: finalNumber,
            text: `✅ *Pedido Confirmado!*\n\nRecebemos seu pedido no valor de *R$ ${total}*. Ele já está sendo preparado! 🍕`,
            delay: 1200
        }, {
            headers: { 'apikey': process.env.EVO_KEY }
        });

        console.log("WhatsApp enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar WhatsApp:", error.response?.data || error.message);
    }
};