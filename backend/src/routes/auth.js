import express from "express";
import { createAdminToken, verifyAdminToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";

  if (username !== adminUser || password !== adminPassword) {
    return res.status(401).json({
      ok: false,
      message: "Usuário ou senha inválidos."
    });
  }

  const token = createAdminToken();

  return res.json({
    ok: true,
    token
  });
});

router.get("/check", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  const isValid = verifyAdminToken(token);

  return res.json({
    ok: isValid
  });
});

export default router;