"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Booking = {
  id: number;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalPrice: number;
  refundAmount: number | null;
  resource?: { id: number; name: string };
};

const STATUS_LABELS = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function euros(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default function BookingsPage() {
  const { token, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Booking[]>("/api/bookings/me", { token })
      .then(setBookings)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue")
      );
  }, [token]);

  async function handleCancel(id: number) {
    if (!window.confirm("Annuler cette réservation ?")) return;
    setError(null);
    setMessage(null);
    setCancellingId(id);
    try {
      const updated = await apiFetch<Booking>(`/api/bookings/${id}/cancel`, {
        method: "POST",
        token,
      });
      setBookings((current) =>
        (current ?? []).map((b) => (b.id === id ? { ...b, ...updated } : b))
      );
      setMessage(
        `Réservation annulée. Remboursement : ${euros(updated.refundAmount ?? 0)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return null;

  if (!token) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <p className="text-gray-600">
          <Link href="/login" className="underline">
            Connecte-toi
          </Link>{" "}
          pour voir tes réservations.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mes réservations</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {message && <p className="text-green-700 text-sm mb-4">{message}</p>}

      {bookings === null ? (
        <p className="text-gray-500">Chargement...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">Aucune réservation pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const cancellable =
              b.status !== "CANCELLED" && new Date(b.startTime) > new Date();
            return (
              <li key={b.id} className="border rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold">
                  {b.resource?.name ?? "Ressource"}
                </h2>
                <p className="text-gray-600">
                  {formatDate(b.startTime)} → {formatDate(b.endTime)}
                </p>
                <p className="mt-2">
                  {euros(b.totalPrice)} · {STATUS_LABELS[b.status]}
                  {b.refundAmount !== null && ` · remboursé ${euros(b.refundAmount)}`}
                </p>
                {cancellable && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    className="mt-3 text-sm underline text-red-600 disabled:opacity-50"
                  >
                    {cancellingId === b.id ? "Annulation..." : "Annuler"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}