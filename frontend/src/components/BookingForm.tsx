"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Props = {
  resourceId: number;
  pricePerHour: number;
};

export default function BookingForm({ resourceId, pricePerHour }: Props) {
  const { token, user, loading } = useAuth();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  let estimate: number | null = null;
  if (startDate && endDate && endDate > startDate) {
    const minutes = (endDate.getTime() - startDate.getTime()) / 60000;
    estimate = Math.round((pricePerHour * minutes) / 60);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const booking = await apiFetch<{ id: number; totalPrice: number }>("/api/bookings", {
        method: "POST",
        token,
        body: {
          resourceId,
          startTime: new Date(start).toISOString(),
          endTime: new Date(end).toISOString(),
        },
      });
      setSuccess(
        `Réservation enregistrée. Total : ${(booking.totalPrice / 100).toFixed(2)} €`
      );
      setStart("");
      setEnd("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <p className="mt-8 text-gray-600">
        <Link href="/login" className="underline">
          Connecte-toi
        </Link>{" "}
        pour réserver cette ressource.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 border rounded-lg p-4">
      <h2 className="text-xl font-semibold">Réserver un créneau</h2>

      <label className="block text-sm">
        Début
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <label className="block text-sm">
        Fin
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      {estimate !== null && (
        <p className="text-sm text-gray-600">
          Prix estimé : {(estimate / 100).toFixed(2)} €
        </p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-700 text-sm">{success}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
      >
        {submitting ? "Réservation..." : "Réserver"}
      </button>
    </form>
  );
}