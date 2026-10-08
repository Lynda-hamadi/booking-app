type Resource = {
  id: number;
  name: string;
  description: string | null;
  pricePerHour: number;
  owner: { id: number; name: string };
};

async function getResources(): Promise<Resource[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Impossible de charger les ressources");
  return res.json();
}

export default async function Home() {
  const resources = await getResources();

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ressources disponibles</h1>

      {resources.length === 0 ? (
        <p className="text-gray-500">Aucune ressource pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {resources.map((r) => (
            <li key={r.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold">{r.name}</h2>
              {r.description && <p className="text-gray-600">{r.description}</p>}
              <p className="mt-2 font-medium">
                {(r.pricePerHour / 100).toFixed(2)} € / heure
              </p>
              <p className="text-sm text-gray-400">Par {r.owner.name}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}