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
      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
        <p className="text-slate-700">Connecte-toi pour réserver cette ressource.</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-900">Réserver un créneau</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Début
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Fin
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      </div>

      {estimate !== null && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Prix estimé :{" "}
          <span className="font-semibold text-slate-900">
            {(estimate / 100).toFixed(2)} €
          </span>
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Réservation..." : "Réserver"}
      </button>
    </form>
  );
}