import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, name: true } } },
    });
    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!resource) {
      res.status(404).json({ error: "Ressource introuvable" });
      return;
    }
    res.json(resource);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", requireAuth, requireOwner, async (req, res) => {
  try {
    const { name, description, pricePerHour } = req.body;

    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "Le nom est requis" });
      return;
    }
    if (!Number.isInteger(pricePerHour) || pricePerHour <= 0) {
      res.status(400).json({ error: "pricePerHour doit être un entier positif (en centimes)" });
      return;
    }

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description : null,
        pricePerHour,
        ownerId: req.user!.userId,
      },
    });
    res.status(201).json(resource);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;