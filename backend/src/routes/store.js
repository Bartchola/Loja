import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function isStoreOpenBySchedule(schedule) {
  if (!schedule?.openTime || !schedule?.closeTime) {
    return false;
  }

  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = schedule.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = schedule.closeTime.split(":").map(Number);

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

function getStoreStatus(store) {
  if (store.autoScheduleEnabled) {
    return isStoreOpenBySchedule(store.schedule);
  }

  return Boolean(store.isOpen);
}

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data");
const storeFilePath = path.join(dataDir, "store.json");

fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(storeFilePath)) {
  fs.writeFileSync(
    storeFilePath,
    JSON.stringify({ isOpen: true, reviews: [] }, null, 2),
    "utf-8"
  );
}

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storeFilePath, "utf-8"));
  } catch {
    return { isOpen: true, reviews: [] };
  }
}

function writeStore(data) {
  fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2), "utf-8");
}



router.get("/status", (req, res) => {
  const store = readStore();

  res.json({
    ok: true,
    isOpen: getStoreStatus(store),
    manualIsOpen: Boolean(store.isOpen),
    autoScheduleEnabled: Boolean(store.autoScheduleEnabled),
    schedule: store.schedule || {
      openTime: "18:00",
      closeTime: "23:30"
    }
  });
});

router.patch("/status", (req, res) => {
  const store = readStore();

  store.isOpen = Boolean(req.body.isOpen);
  writeStore(store);

  res.json({
    ok: true,
    isOpen: getStoreStatus(store),
    manualIsOpen: Boolean(store.isOpen),
    autoScheduleEnabled: Boolean(store.autoScheduleEnabled),
    schedule: store.schedule
  });
});

router.patch("/schedule", (req, res) => {
  const store = readStore();

  const { autoScheduleEnabled, openTime, closeTime } = req.body;

  store.autoScheduleEnabled = Boolean(autoScheduleEnabled);

  store.schedule = {
    openTime: openTime || store.schedule?.openTime || "18:00",
    closeTime: closeTime || store.schedule?.closeTime || "23:30"
  };

  writeStore(store);

  res.json({
    ok: true,
    isOpen: getStoreStatus(store),
    manualIsOpen: Boolean(store.isOpen),
    autoScheduleEnabled: Boolean(store.autoScheduleEnabled),
    schedule: store.schedule
  });
});

router.get("/reviews", (req, res) => {
  const store = readStore();

  res.json({
    ok: true,
    reviews: store.reviews || []
  });
});

router.post("/reviews", (req, res) => {
  try {
    const store = readStore();

    const { orderId, customerName, rating, comment } = req.body;

    const numericRating = Number(rating);

    if (!orderId || Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        ok: false,
        message: "Avaliação inválida."
      });
    }

    store.reviews = Array.isArray(store.reviews) ? store.reviews : [];

    const alreadyReviewed = store.reviews.some(
      (review) => String(review.orderId) === String(orderId)
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        ok: false,
        message: "Esse pedido já foi avaliado."
      });
    }

    const review = {
      id: Date.now(),
      orderId: String(orderId),
      customerName: String(customerName || "Cliente").trim(),
      rating: numericRating,
      comment: String(comment || "").trim(),
      createdAt: new Date().toISOString()
    };

    store.reviews.push(review);
    writeStore(store);

    return res.status(201).json({
      ok: true,
      message: "Avaliação enviada com sucesso.",
      review
    });
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);

    return res.status(500).json({
      ok: false,
      message: "Erro ao salvar avaliação."
    });
  }
});

function formatScheduleHours(schedule) {
  if (!schedule?.openTime || !schedule?.closeTime) {
    return "";
  }

  return `Todos os dias das ${schedule.openTime} às ${schedule.closeTime}`;
}

router.get("/contact", (req, res) => {
  const store = readStore();

  const contact = store.contact || {
    phone: "(51) 99999-9999",
    address: "Rua Exemplo, 123 - Centro",
    email: "contato@seudominio.com",
    displayHours: "Todos os dias das 18h às 23h"
  };

  const hoursText = store.autoScheduleEnabled
    ? formatScheduleHours(store.schedule)
    : contact.displayHours;

  res.json({
    ok: true,
    contact: {
      ...contact,
      displayHours: hoursText,
      autoScheduleEnabled: Boolean(store.autoScheduleEnabled)
    }
  });
});

router.patch("/contact", (req, res) => {
  const store = readStore();

  const currentContact = store.contact || {
    phone: "(51) 99999-9999",
    address: "Rua Exemplo, 123 - Centro",
    email: "contato@seudominio.com",
    displayHours: "Todos os dias das 18h às 23h"
  };

  const { phone, address, email, displayHours } = req.body;

  store.contact = {
    phone: phone !== undefined ? String(phone).trim() : currentContact.phone,
    address: address !== undefined ? String(address).trim() : currentContact.address,
    email: email !== undefined ? String(email).trim() : currentContact.email,
    displayHours:
      displayHours !== undefined ? String(displayHours).trim() : currentContact.displayHours
  };

  writeStore(store);

  return res.json({
    ok: true,
    contact: store.contact
  });
});

export default router;