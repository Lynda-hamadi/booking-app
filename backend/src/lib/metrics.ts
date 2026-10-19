import type { Request, Response, NextFunction } from "express";
import { Histogram, collectDefaultMetrics, register } from "prom-client";

// Métriques du processus Node : mémoire, CPU, boucle d'événements...
collectDefaultMetrics();

// Durée de chaque requête HTTP, par méthode, route et code de statut
const httpDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const stopTimer = httpDuration.startTimer();
  res.on("finish", () => {
    // On utilise le modèle de la route (/api/bookings/:id/cancel) et non l'URL réelle,
    // pour ne pas créer une série de métriques par identifiant
    const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
    stopTimer({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
}