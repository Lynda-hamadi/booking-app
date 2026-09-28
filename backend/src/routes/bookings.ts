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

router.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    // 404 aussi si la réservation appartient à quelqu'un d'autre :
    // on ne révèle pas l'existence des réservations des autres
    if (!booking || booking.userId !== req.user!.userId) {
      res.status(404).json({ error: "Réservation introuvable" });
      return;
    }
    if (booking.status === "CANCELLED") {
      res.status(409).json({ error: "Réservation déjà annulée" });
      return;
    }

    const now = new Date();
    if (booking.startTime <= now) {
      res.status(400).json({ error: "Impossible d'annuler une réservation déjà commencée" });
      return;
    }

    const hoursBeforeStart = (booking.startTime.getTime() - now.getTime()) / 3600000;
    const refundAmount =
      hoursBeforeStart >= 24 ? booking.totalPrice : Math.round(booking.totalPrice * 0.5);

    // Mise à jour conditionnelle : si deux annulations arrivent en même temps,
    // une seule passe (la seconde trouve 0 ligne à modifier)
    const result = await prisma.booking.updateMany({
      where: { id, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED", refundAmount },
    });
    if (result.count === 0) {
      res.status(409).json({ error: "Réservation déjà annulée" });
      return;
    }

    const updated = await prisma.booking.findUnique({ where: { id } });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});







export default router;