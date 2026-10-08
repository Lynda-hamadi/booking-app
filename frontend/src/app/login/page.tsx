"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth, type User } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiFetch<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      login(data.token, data.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded p-2"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {submitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/register" className="underline">
          S&apos;inscrire
        </Link>
      </p>
    </main>
  );
}