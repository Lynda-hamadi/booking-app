import Link from "next/link";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";

type Resource = {
  id: number;
  name: string;
  description: string | null;
  pricePerHour: number;
  owner: { id: number; name: string };
};

async function getResource(id: string): Promise<Resource | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error("Impossible de charger la ressource");
  return res.json();
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) notFound();

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        ← Retour aux ressources
      </Link>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900">{resource.name}</h1>
          <span className="shrink-0 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
            {(resource.pricePerHour / 100).toFixed(2)} €/h
          </span>
        </div>

        <p className="mt-3 text-slate-600">
          {resource.description ?? "Pas de description."}
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Proposé par {resource.owner.name}
        </p>
      </section>

      <BookingForm resourceId={resource.id} pricePerHour={resource.pricePerHour} />
    </main>
  );
}