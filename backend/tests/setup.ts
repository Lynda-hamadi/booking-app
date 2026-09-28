import dotenv from "dotenv";

dotenv.config({ path: ".env.test", override: true });

if (!process.env.DATABASE_URL?.includes("test")) {
  throw new Error("Les tests doivent utiliser une base de test (DATABASE_URL doit contenir 'test')");
}