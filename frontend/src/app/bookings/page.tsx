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

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
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
      <main className="max-w-3xl mx-auto px-8 py-10">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <p className="text-slate-700">Connecte-toi pour voir tes réservations.</p>
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

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Mes réservations</h1>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      {bookings === null ? (
        <p className="mt-6 text-slate-500">Chargement...</p>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aucune réservation pour le moment.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => {
            const cancellable =
              b.status !== "CANCELLED" && new Date(b.startTime) > new Date();
            return (
              <li
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {b.resource?.name ?? "Ressource"}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
                  >
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(b.startTime)} → {formatDate(b.endTime)}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{euros(b.totalPrice)}</span>
                    {b.refundAmount !== null && (
                      <span className="text-slate-500">
                        {" "}
                        · remboursé {euros(b.refundAmount)}
                      </span>
                    )}
                  </p>

                  {cancellable && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancellingId === b.id ? "Annulation..." : "Annuler"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}