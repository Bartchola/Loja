import axios from 'axios';

export const enviarZapConfirmacao = async (telefone, nomeCliente, pedidoId) => {
    try {
        // Formata o número: remove caracteres não numéricos e garante o 55
        const numeroLimpo = telefone.replace(/\D/g, '');
        const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

        const url = `${process.env.EVO_URL}/message/sendText/${process.env.EVO_INSTANCE}`;
        
        const data = {
            "number": numeroFinal,
            "text": `✅ *Pedido Confirmado!* \n\nOlá ${nomeCliente}, seu pedido #${pedidoId} já foi recebido e está em preparo! 🍕`,
            "delay": 1200,
            "linkPreview": false
        };

        await axios.post(url, data, {
            headers: { 'apikey': process.env.EVO_KEY }
        });

        console.log(`WhatsApp enviado para ${nomeCliente}`);
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error.response?.data || error.message);
    }
};