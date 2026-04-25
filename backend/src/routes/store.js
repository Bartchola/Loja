import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    isOpen: store.isOpen
  });
});

router.patch("/status", (req, res) => {
  const store = readStore();

  store.isOpen = Boolean(req.body.isOpen);
  writeStore(store);

  res.json({
    ok: true,
    isOpen: store.isOpen
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
  const store = readStore();

  const { orderId, rating, comment } = req.body;

  const numericRating = Number(rating);

  if (!orderId || Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      ok: false,
      message: "Avaliação inválida."
    });
  }

  const alreadyReviewed = store.reviews?.some(
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
    orderId,
    rating: numericRating,
    comment: comment || "",
    createdAt: new Date().toISOString()
  };

  store.reviews = Array.isArray(store.reviews) ? store.reviews : [];
  store.reviews.push(review);

  writeStore(store);

  res.status(201).json({
    ok: true,
    review
  });
});

export default router;