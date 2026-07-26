import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DessertForm from "@/components/admin/DessertForm";

export const dynamic = "force-dynamic";

export default async function EditDessertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const dessert = await prisma.dessert.findUnique({ where: { id } });
  if (!dessert) notFound();

  return (
    <div>
      <nav className="mb-6 text-xs text-ink-faint">
        <Link href="/admin/desserts" className="hover:text-berry">
          Desserts
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{dessert.name}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">{dessert.name}</h1>
        <Link
          href={`/gallery/${dessert.slug}`}
          target="_blank"
          className="text-xs text-berry underline"
        >
          View on the site ↗
        </Link>
      </div>

      <DessertForm dessert={dessert} />
    </div>
  );
}
