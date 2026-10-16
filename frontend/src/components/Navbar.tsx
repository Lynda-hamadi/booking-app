"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          Booking App
        </Link>

        {!loading && (
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                {user.role === "OWNER" && (
                  <Link
                    href="/resources/new"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
                  >
                    Nouvelle ressource
                  </Link>
                )}
                <Link
                  href="/bookings"
                  className="text-slate-600 hover:text-indigo-600"
                >
                  Mes réservations
                </Link>
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-indigo-600"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}