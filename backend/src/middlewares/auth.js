import crypto from "crypto";

const ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || "dev-secret-change-me";
const TOKEN_DURATION_MS = 1000 * 60 * 60 * 8; // 8 horas

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(data) {
  return crypto
    .createHmac("sha256", ADMIN_AUTH_SECRET)
    .update(data)
    .digest("base64url");
}

export function createAdminToken() {
  const payload = {
    role: "admin",
    exp: Date.now() + TOKEN_DURATION_MS
  };

  const data = base64UrlEncode(payload);
  const signature = sign(data);

  return `${data}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || !token.includes(".")) return false;

  const [data, signature] = token.split(".");

  const expectedSignature = sign(data);

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));

    if (payload.role !== "admin") return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  const isValid = verifyAdminToken(token);

  if (!isValid) {
    return res.status(401).json({
      ok: false,
      message: "Acesso não autorizado."
    });
  }

  next();
}