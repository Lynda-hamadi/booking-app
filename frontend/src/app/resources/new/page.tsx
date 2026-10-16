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
      <main className="max-w-md mx-auto p-8">
        <p className="text-gray-600">
          <Link href="/login" className="underline">
            Connecte-toi
          </Link>{" "}
          pour créer une ressource.
        </p>
      </main>
    );
  }

  if (user.role !== "OWNER") {
    return (
      <main className="max-w-md mx-auto p-8">
        <p className="text-gray-600">
          Seuls les propriétaires peuvent créer des ressources.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle ressource</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nom (ex : Salle de réunion A)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded p-2"
        />
        <textarea
          placeholder="Description (facultatif)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Prix par heure en euros (ex : 25)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer la ressource"}
        </button>
      </form>
    </main>
  );
}