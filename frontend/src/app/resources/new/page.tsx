"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewResourcePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const euros = parseFloat(price.replace(",", "."));
    if (isNaN(euros) || euros <= 0) {
      setError("Le prix doit être un nombre positif");
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch<{ id: number }>("/api/resources", {
        method: "POST",
        token,
        body: {
          name,
          description: description || undefined,
          pricePerHour: Math.round(euros * 100),
        },
      });
      router.push(`/resources/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-8 py-12">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <p className="text-slate-700">Connecte-toi pour créer une ressource.</p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  if (user.role !== "OWNER") {
    return (
      <main className="max-w-md mx-auto px-8 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          Seuls les propriétaires peuvent créer des ressources.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-8 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle ressource</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ajoute une salle, un studio ou du matériel à réserver.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Nom
            <input
              type="text"
              placeholder="Ex : Salle de réunion A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Description (facultatif)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Prix par heure (en euros)
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex : 25"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer la ressource"}
          </button>
        </form>
      </div>
    </main>
  );
}