import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import resourceRoutes from "./routes/resources.js";
import bookingRoutes from "./routes/bookings.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const users = await prisma.user.count();
    res.json({ status: "ok", database: "connected", users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});