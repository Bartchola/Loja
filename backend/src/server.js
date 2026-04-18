import 'dotenv/config'; // Isso deve ser a primeira linha do arquivo
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ordersRouter from "./routes/orders.js";
import { sendOrderConfirmation } from './services/whatsappService.js'; // Importe o serviço que vamos criar

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*"
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "frito-crocante-backend"
  });
});

app.use("/api/orders", ordersRouter);

app.post('/api/checkout', async (req, res) => {
    const { items, total, customer } = req.body;

    try {
        // ... sua lógica atual de salvar o pedido ...

        // GATILHO DO WHATSAPP
        //customer.phone deve ser o campo onde você recebe o zap do cliente
        await sendOrderConfirmation(customer.phone, "Novo Pedido"); 

        res.status(200).json({ message: "Pedido realizado!" });
    } catch (error) {
        res.status(500).send("Erro no servidor");
    }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});