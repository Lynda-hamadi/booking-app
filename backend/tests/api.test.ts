import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const inHours = (h: number) => new Date(Date.now() + h * 3600000);
const iso = (d: Date) => d.toISOString();

let ownerToken: string;
let userToken: string;
let resourceId: number;

async function registerAndLogin(email: string, name: string, role?: string) {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: "motdepasse123", name, role });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "motdepasse123" });
  return res.body.token as string;
}

function book(token: string, start: Date, end: Date) {
  return request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({ resourceId, startTime: iso(start), endTime: iso(end) });
}

beforeAll(async () => {
  await prisma.booking.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();

  ownerToken = await registerAndLogin("owner@test.com", "Owner", "OWNER");
  userToken = await registerAndLogin("user@test.com", "User");

  const res = await request(app)
    .post("/api/resources")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ name: "Salle A", pricePerHour: 2500 });
  resourceId = res.body.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentification", () => {
  it("refuse un mot de passe trop court", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "x@test.com", password: "court", name: "X" });
    expect(res.status).toBe(400);
  });

  it("refuse un mauvais mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "mauvaismdp" });
    expect(res.status).toBe(401);
  });

  it("refuse la création de ressource sans token", async () => {
    const res = await request(app)
      .post("/api/resources")
      .send({ name: "Salle B", pricePerHour: 1000 });
    expect(res.status).toBe(401);
  });

  it("refuse la création de ressource à un simple utilisateur", async () => {
    const res = await request(app)
      .post("/api/resources")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Salle B", pricePerHour: 1000 });
    expect(res.status).toBe(403);
  });
});

describe("Réservations", () => {
  const base = inHours(24 * 5);
  const plusH = (h: number) => new Date(base.getTime() + h * 3600000);

  it("calcule le prix côté serveur", async () => {
    const res = await book(userToken, base, plusH(2));
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(5000);
  });

  it("refuse un créneau qui chevauche (409)", async () => {
    const res = await book(userToken, plusH(1), plusH(3));
    expect(res.status).toBe(409);
  });

  it("accepte un créneau collé au précédent", async () => {
    const res = await book(userToken, plusH(2), plusH(4));
    expect(res.status).toBe(201);
  });

  it("refuse un créneau dans le passé", async () => {
    const res = await book(userToken, inHours(-3), inHours(-1));
    expect(res.status).toBe(400);
  });

  it("laisse passer une seule réservation sur 5 requêtes simultanées", async () => {
    const start = inHours(24 * 6);
    const end = new Date(start.getTime() + 2 * 3600000);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => book(userToken, start, end))
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
  });
});

describe("Annulation", () => {
  it("rembourse 100 % à plus de 24h", async () => {
    const start = inHours(24 * 7);
    const created = await book(userToken, start, new Date(start.getTime() + 2 * 3600000));

    const res = await request(app)
      .post(`/api/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect(res.body.refundAmount).toBe(5000);
  });

  it("rembourse 50 % à moins de 24h", async () => {
    const created = await book(userToken, inHours(2), inHours(4));

    const res = await request(app)
      .post(`/api/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.refundAmount).toBe(2500);
  });

  it("refuse une double annulation", async () => {
    const start = inHours(24 * 8);
    const created = await book(userToken, start, new Date(start.getTime() + 3600000));
    const url = `/api/bookings/${created.body.id}/cancel`;

    await request(app).post(url).set("Authorization", `Bearer ${userToken}`);
    const second = await request(app).post(url).set("Authorization", `Bearer ${userToken}`);

    expect(second.status).toBe(409);
  });

  it("cache la réservation d'un autre utilisateur (404)", async () => {
    const start = inHours(24 * 9);
    const created = await book(userToken, start, new Date(start.getTime() + 3600000));

    const res = await request(app)
      .post(`/api/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(404);
  });
});