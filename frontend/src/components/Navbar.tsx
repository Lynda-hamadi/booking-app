"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b">
      <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Booking App
        </Link>

        {!loading && (
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="text-gray-600">{user.name}</span>
                <button onClick={logout} className="underline">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="underline">
                  Connexion
                </Link>
                <Link href="/register" className="underline">
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