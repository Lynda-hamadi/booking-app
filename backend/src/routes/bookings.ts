import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function isOverlapError(error: unknown): boolean {
  const text = `${(error as Error)?.message ?? ""} ${JSON.stringify(error)}`;
  return text.includes("booking_no_overlap") || text.includes("23P01");
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { resourceId, startTime, endTime } = req.body;

    if (!Number.isInteger(resourceId)) {
      res.status(400).json({ error: "resourceId invalide" });
      return;
    }
    if (typeof startTime !== "string" || typeof endTime !== "string") {
      res.status(400).json({ error: "startTime et endTime sont requis" });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Dates invalides" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ error: "La fin doit être après le début" });
      return;
    }
    if (start <= new Date()) {
      res.status(400).json({ error: "Le créneau doit être dans le futur" });
      return;
    }

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) {
      res.status(404).json({ error: "Ressource introuvable" });
      return;
    }

    const minutes = (end.getTime() - start.getTime()) / 60000;
    const totalPrice = Math.round((resource.pricePerHour * minutes) / 60);

    const booking = await prisma.booking.create({
      data: {
        startTime: start,
        endTime: end,
        totalPrice,
        userId: req.user!.userId,
        resourceId,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    if (isOverlapError(error)) {
      res.status(409).json({ error: "Ce créneau est déjà réservé" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.userId },
      orderBy: { startTime: "asc" },
      include: { resource: { select: { id: true, name: true } } },
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;