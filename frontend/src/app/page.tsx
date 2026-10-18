import Link from "next/link";

type Resource = {
  id: number;
  name: string;
  description: string | null;
  pricePerHour: number;
  owner: { id: number; name: string };
};

async function getResources(): Promise<Resource[]> {
  const res = await fetch(`${process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL}/api/resources`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Impossible de charger les ressources");
  return res.json();
}

export default async function Home() {
  const resources = await getResources();

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Réserve en quelques clics
        </h1>
        <p className="mt-2 text-slate-600">
          Salles, studios, matériel : choisis une ressource et réserve ton créneau.
        </p>
      </header>

      {resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aucune ressource pour le moment.
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {resources.map((r) => (
            <li key={r.id}>
              <Link
                href={`/resources/${r.id}`}
                className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                    {r.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    {(r.pricePerHour / 100).toFixed(2)} €/h
                  </span>
                </div>

                <p className="mt-2 flex-1 text-sm text-slate-600">
                  {r.description ?? "Pas de description."}
                </p>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Par {r.owner.name}</span>
                  <span className="font-medium text-indigo-600">
                    Voir et réserver →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}