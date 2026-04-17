import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ordersRouter from "./routes/orders.js";

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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});