import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import DessertForm from "@/components/admin/DessertForm";

export const dynamic = "force-dynamic";

export default async function NewDessertPage() {
  await requireAdmin();

  return (
    <div>
      <nav className="mb-6 text-xs text-ink-faint">
        <Link href="/admin/desserts" className="hover:text-berry">
          Desserts
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">New</span>
      </nav>

      <h1 className="mb-8 text-4xl">Add a dessert</h1>

      <DessertForm />
    </div>
  );
}
