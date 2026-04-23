import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data");
const menuFilePath = path.join(dataDir, "menu.json");
const imagesDir = path.join(__dirname, "../../../frontend/assets/images");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

if (!fs.existsSync(menuFilePath)) {
  fs.writeFileSync(menuFilePath, "[]", "utf-8");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function readMenu() {
  try {
    const raw = fs.readFileSync(menuFilePath, "utf-8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erro ao ler menu.json:", error);
    return [];
  }
}

function writeMenu(menu) {
  fs.writeFileSync(menuFilePath, JSON.stringify(menu, null, 2), "utf-8");
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true";
  }
  return fallback;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    const baseName = slugify(req.body.name || "item");
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get("/", (req, res) => {
  const menu = readMenu();
  const isAdmin = req.query.admin === "true";

  if (isAdmin) {
    return res.json({ ok: true, items: menu });
  }

  const publicItems = menu.filter((item) => item.active && item.available);
  return res.json({ ok: true, items: publicItems });
});

router.get("/:id", (req, res) => {
  const menu = readMenu();
  const item = menu.find((entry) => String(entry.id) === String(req.params.id));

  if (!item) {
    return res.status(404).json({ ok: false, message: "Item não encontrado." });
  }

  return res.json({ ok: true, item });
});

router.post("/", upload.single("imageFile"), (req, res) => {
  try {
    const menu = readMenu();

    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const price = Number(req.body.price);

    if (!name || !category || !description || Number.isNaN(price)) {
      return res.status(400).json({
        ok: false,
        message: "Preencha nome, categoria, descrição e preço corretamente."
      });
    }

    const newItem = {
      id: menu.length ? Math.max(...menu.map((item) => Number(item.id) || 0)) + 1 : 1,
      name,
      category,
      description,
      price,
      image: req.file ? req.file.filename : "",
      active: parseBoolean(req.body.active, true),
      available: parseBoolean(req.body.available, true)
    };

    menu.push(newItem);
    writeMenu(menu);

    return res.status(201).json({ ok: true, item: newItem });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao salvar item do cardápio."
    });
  }
});

router.put("/:id", upload.single("imageFile"), (req, res) => {
  try {
    const menu = readMenu();
    const index = menu.findIndex((entry) => String(entry.id) === String(req.params.id));

    if (index === -1) {
      return res.status(404).json({ ok: false, message: "Item não encontrado." });
    }

    const currentItem = menu[index];

    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const price = Number(req.body.price);

    if (!name || !category || !description || Number.isNaN(price)) {
      return res.status(400).json({
        ok: false,
        message: "Preencha nome, categoria, descrição e preço corretamente."
      });
    }

    const updatedItem = {
      ...currentItem,
      name,
      category,
      description,
      price,
      image: req.file
        ? req.file.filename
        : String(req.body.currentImage || currentItem.image || "").trim(),
      active: parseBoolean(req.body.active, currentItem.active),
      available: parseBoolean(req.body.available, currentItem.available)
    };

    menu[index] = updatedItem;
    writeMenu(menu);

    return res.json({ ok: true, item: updatedItem });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao atualizar item do cardápio."
    });
  }
});

router.patch("/:id/toggle-active", (req, res) => {
  try {
    const menu = readMenu();
    const index = menu.findIndex((entry) => String(entry.id) === String(req.params.id));

    if (index === -1) {
      return res.status(404).json({ ok: false, message: "Item não encontrado." });
    }

    menu[index].active = !menu[index].active;
    writeMenu(menu);

    return res.json({ ok: true, item: menu[index] });
  } catch (error) {
    console.error("Erro ao alternar active:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao alterar status do item."
    });
  }
});

router.patch("/:id/toggle-available", (req, res) => {
  try {
    const menu = readMenu();
    const index = menu.findIndex((entry) => String(entry.id) === String(req.params.id));

    if (index === -1) {
      return res.status(404).json({ ok: false, message: "Item não encontrado." });
    }

    menu[index].available = !menu[index].available;
    writeMenu(menu);

    return res.json({ ok: true, item: menu[index] });
  } catch (error) {
    console.error("Erro ao alternar available:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao alterar disponibilidade do item."
    });
  }
});

export default router;