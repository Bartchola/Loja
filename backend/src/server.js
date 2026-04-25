import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import ordersRouter from "./routes/orders.js";
import menuRouter from "./routes/menu.js";
import storeRouter from "./routes/store.js";

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json());

app.use(
  "/assets/images",
  express.static(path.join(__dirname, "../../frontend/assets/images"))
);

app.use(
  "/assets",
  express.static(path.join(__dirname, "../../frontend/assets"))
);

app.use(
  "/pages",
  express.static(path.join(__dirname, "../../frontend/pages"))
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/orders", ordersRouter);
app.use("/api/menu", menuRouter);
app.use("/api/store", storeRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});