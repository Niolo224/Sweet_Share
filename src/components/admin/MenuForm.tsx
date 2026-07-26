"use client";

import { useActionState } from "react";
import { saveMenuAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

type Menu = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  season: string | null;
  coverImageUrl: string | null;
  pdfUrl: string | null;
  isActive: boolean;
  items: { dessertId: string }[];
};

export default function MenuForm({
  menu,
  desserts,
}: {
  menu?: Menu;
  desserts: Array<{ id: string; name: string; category: string }>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveMenuAction,
    null,
  );

  const chosen = new Set(menu?.items.map((item) => item.dessertId) ?? []);

  return (
    <form action={formAction} className="card-plinth space-y-6 rounded-2xl p-6 sm:p-7">
      {menu && <input type="hidden" name="id" value={menu.id} />}

      <h2 className="text-2xl">{menu ? `Edit “${menu.title}”` : "Create a menu"}</h2>

      {state?.error && (
        <p className="rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="menu-title">
            Title <span className="text-berry">*</span>
          </label>
          <input
            id="menu-title"
            name="title"
            required
            defaultValue={menu?.title}
            className="field"
            placeholder="The Advent Collection"
          />
        </div>
        <div>
          <label className="label" htmlFor="menu-season">
            Season
          </label>
          <input
            id="menu-season"
            name="season"
            defaultValue={menu?.season ?? ""}
            className="field"
            placeholder="Spring, Harvest, Advent, Everyday"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="menu-subtitle">
          Subtitle
        </label>
        <input
          id="menu-subtitle"
          name="subtitle"
          defaultValue={menu?.subtitle ?? ""}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="menu-description">
          Description
        </label>
        <textarea
          id="menu-description"
          name="description"
          rows={3}
          defaultValue={menu?.description ?? ""}
          className="field resize-y"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="menu-cover">
            Cover picture
          </label>
          <input
            id="menu-cover"
            name="coverFile"
            type="file"
            accept="image/*"
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-4 file:py-1.5 file:text-xs file:text-plum"
          />
          <input
            name="coverImageUrl"
            defaultValue={menu?.coverImageUrl ?? ""}
            className="field mt-2"
            placeholder="…or paste an image address"
          />
        </div>

        <div>
          <label className="label" htmlFor="menu-pdf">
            Printed menu (PDF)
          </label>
          <input
            id="menu-pdf"
            name="pdfFile"
            type="file"
            accept="application/pdf"
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-4 file:py-1.5 file:text-xs file:text-plum"
          />
          <input
            name="pdfUrl"
            defaultValue={menu?.pdfUrl ?? ""}
            className="field mt-2"
            placeholder="…or paste a PDF address"
          />
          <p className="mt-1.5 text-[0.68rem] text-ink-faint">
            Guests can download this from the gallery page.
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="label">Which desserts are on this menu?</legend>
        <div className="mt-2 grid gap-2 rounded-xl border border-blush/60 bg-white/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {desserts.map((dessert) => (
            <label
              key={dessert.id}
              className="flex items-center gap-2.5 text-sm text-ink-soft"
            >
              <input
                type="checkbox"
                name="dessertIds"
                value={dessert.id}
                defaultChecked={chosen.has(dessert.id)}
                className="h-4 w-4 accent-[#ee6f94]"
              />
              <span className="truncate">{dessert.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={menu?.isActive ?? false}
          className="h-4 w-4 accent-[#ee6f94]"
        />
        Make this the live menu — the one shown on the gallery page
      </label>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Saving…">
          {menu ? "Save menu" : "Create menu"}
        </SubmitButton>
        {menu && (
          <a href="/admin/menus" className="btn btn-ghost">
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
