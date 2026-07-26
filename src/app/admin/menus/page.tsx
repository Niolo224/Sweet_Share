import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import MenuForm from "@/components/admin/MenuForm";
import SubmitButton from "@/components/admin/SubmitButton";
import { publishMenuAction, deleteMenuAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { edit, saved } = await searchParams;

  const [menus, desserts] = await Promise.all([
    prisma.menu.findMany({
      orderBy: [{ isActive: "desc" }, { publishedAt: "desc" }],
      include: { items: true, _count: { select: { items: true } } },
    }),
    prisma.dessert.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
  ]);

  const editing = edit ? menus.find((menu) => menu.id === edit) : undefined;

  return (
    <div>
      <h1 className="text-4xl">Menus</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        A menu is a collection you publish — a season, a holiday, a wedding
        list. One menu is live at a time, and it is what shows at the top of
        your gallery page.
      </p>

      {saved && (
        <p className="mt-6 rounded-xl border border-rose/40 bg-cloud/60 px-4 py-3 text-sm text-plum">
          Saved.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="order-2 lg:order-1">
          <MenuForm
            key={editing?.id ?? "new"}
            menu={editing}
            desserts={desserts}
          />
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <h2 className="text-xl">Your menus</h2>

          {menus.length === 0 ? (
            <p className="rounded-2xl border border-blush/60 bg-white/50 p-6 text-center text-sm text-ink-faint">
              None yet — create your first with the form.
            </p>
          ) : (
            menus.map((menu) => (
              <div
                key={menu.id}
                className={`rounded-2xl border p-5 ${
                  menu.isActive
                    ? "border-rose/60 bg-gradient-to-br from-cloud to-white"
                    : "border-blush/60 bg-white/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg text-plum">{menu.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {menu._count.items}{" "}
                      {menu._count.items === 1 ? "dessert" : "desserts"} ·{" "}
                      {formatDate(menu.publishedAt, "short")}
                    </p>
                  </div>
                  {menu.isActive && <span className="badge shrink-0">Live</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/admin/menus?edit=${menu.id}`}
                    className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                  >
                    Edit
                  </a>

                  {!menu.isActive && (
                    <form action={publishMenuAction}>
                      <input type="hidden" name="id" value={menu.id} />
                      <SubmitButton
                        className="rounded-full bg-gradient-to-r from-rose to-berry px-3.5 py-1.5 text-xs text-white"
                        pendingLabel="…"
                      >
                        Publish
                      </SubmitButton>
                    </form>
                  )}

                  <form action={deleteMenuAction}>
                    <input type="hidden" name="id" value={menu.id} />
                    <SubmitButton
                      className="rounded-full border border-berry/40 px-3.5 py-1.5 text-xs text-berry transition-colors hover:bg-berry/10"
                      pendingLabel="…"
                      confirm={`Delete the ${menu.title} menu? The desserts themselves are kept.`}
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
