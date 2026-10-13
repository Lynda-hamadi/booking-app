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
    <main className="max-w-3xl mx-auto p-8">
      <Link href="/" className="text-sm underline text-gray-600">
        ← Retour aux ressources
      </Link>

      <h1 className="text-3xl font-bold mt-4">{resource.name}</h1>
      {resource.description && (
        <p className="text-gray-600 mt-2">{resource.description}</p>
      )}
      <p className="mt-4 font-medium">
        {(resource.pricePerHour / 100).toFixed(2)} € / heure
      </p>
      <p className="text-sm text-gray-400">Par {resource.owner.name}</p>

      <BookingForm resourceId={resource.id} pricePerHour={resource.pricePerHour} />
    </main>
  );
}