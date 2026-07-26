"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveDessertAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";
import { parseList, type IngredientLine } from "@/lib/utils";

type Dessert = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  story: string | null;
  category: string;
  priceCents: number;
  unitLabel: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ingredients: string;
  allergens: string;
  badges: string;
  servingSize: string | null;
  calories: number | null;
  totalCarbsG: number | null;
  fiberG: number | null;
  sugarsG: number | null;
  addedSugarsG: number | null;
  sugarAlcoholG: number | null;
  proteinG: number | null;
  fatG: number | null;
  satFatG: number | null;
  sodiumMg: number | null;
  sweetener: string | null;
  glycemicLoad: number | null;
  glycemicNote: string | null;
  leadTimeDays: number;
  servesText: string | null;
  scripture: string | null;
  scriptureRef: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

const CATEGORIES = [
  "cakes",
  "tarts",
  "cookies",
  "pastries",
  "puddings",
  "breads",
  "seasonal",
];

const NUTRITION_FIELDS: Array<{ name: keyof Dessert; label: string; unit: string }> = [
  { name: "calories", label: "Calories", unit: "" },
  { name: "totalCarbsG", label: "Total carbs", unit: "g" },
  { name: "fiberG", label: "Fibre", unit: "g" },
  { name: "sugarsG", label: "Total sugars", unit: "g" },
  { name: "addedSugarsG", label: "Added sugars", unit: "g" },
  { name: "sugarAlcoholG", label: "Sugar alcohols", unit: "g" },
  { name: "proteinG", label: "Protein", unit: "g" },
  { name: "fatG", label: "Total fat", unit: "g" },
  { name: "satFatG", label: "Saturated fat", unit: "g" },
  { name: "sodiumMg", label: "Sodium", unit: "mg" },
];

export default function DessertForm({ dessert }: { dessert?: Dessert }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveDessertAction,
    null,
  );
  const [preview, setPreview] = useState(dessert?.imageUrl ?? "");

  const ingredientText = dessert
    ? parseList<IngredientLine>(dessert.ingredients)
        .map((line) => (line.note ? `${line.name} — ${line.note}` : line.name))
        .join("\n")
    : "";

  return (
    <form action={formAction} className="space-y-8">
      {dessert && <input type="hidden" name="id" value={dessert.id} />}

      {state?.error && (
        <p className="rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {state.error}
        </p>
      )}

      {/* ── The basics ────────────────────────────────────── */}
      <Section title="The basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              name="name"
              required
              defaultValue={dessert?.name}
              className="field"
              placeholder="Chocolate & Date Torte"
            />
          </Field>
          <Field label="Web address (slug)" hint="Leave blank and we will make one.">
            <input
              name="slug"
              defaultValue={dessert?.slug}
              className="field"
              placeholder="chocolate-date-torte"
            />
          </Field>
        </div>

        <Field label="Tagline" hint="One short line, shown on the card.">
          <input
            name="tagline"
            defaultValue={dessert?.tagline}
            className="field"
            placeholder="Deep, dark and sweetened only by fruit"
          />
        </Field>

        <Field label="Description" hint="A paragraph for the product page.">
          <textarea
            name="description"
            rows={3}
            defaultValue={dessert?.description}
            className="field resize-y"
          />
        </Field>

        <Field
          label="Why this one exists"
          hint="Optional. The story behind it — this is what people remember."
        >
          <textarea
            name="story"
            rows={4}
            defaultValue={dessert?.story ?? ""}
            className="field resize-y"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Category">
            <select
              name="category"
              defaultValue={dessert?.category ?? "cakes"}
              className="field"
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price" required>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={dessert ? (dessert.priceCents / 100).toFixed(2) : ""}
              className="field"
              placeholder="42.00"
            />
          </Field>
          <Field label="Sold as" hint="each, box of 6, 8-inch cake…">
            <input
              name="unitLabel"
              defaultValue={dessert?.unitLabel ?? "each"}
              className="field"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Days of notice needed">
            <input
              name="leadTimeDays"
              type="number"
              min="0"
              max="30"
              defaultValue={dessert?.leadTimeDays ?? 2}
              className="field"
            />
          </Field>
          <Field label="Serves">
            <input
              name="servesText"
              defaultValue={dessert?.servesText ?? ""}
              className="field"
              placeholder="Serves 10"
            />
          </Field>
          <Field label="Order on the page" hint="Lower numbers come first.">
            <input
              name="sortOrder"
              type="number"
              defaultValue={dessert?.sortOrder ?? 0}
              className="field"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6">
          <Checkbox
            name="isAvailable"
            label="Available to order"
            defaultChecked={dessert?.isAvailable ?? true}
          />
          <Checkbox
            name="isFeatured"
            label="Feature on the home page"
            defaultChecked={dessert?.isFeatured ?? false}
          />
        </div>
      </Section>

      {/* ── Picture ───────────────────────────────────────── */}
      <Section title="Picture">
        <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-5">
            <Field label="Upload a photo" hint="JPG, PNG or WebP, up to 8 MB.">
              <input
                name="imageFile"
                type="file"
                accept="image/*"
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-4 file:py-1.5 file:text-xs file:text-plum"
              />
            </Field>

            <Field
              label="…or paste an image address"
              hint="An upload always wins over a pasted address."
            >
              <input
                name="imageUrl"
                defaultValue={dessert?.imageUrl ?? ""}
                onChange={(event) => setPreview(event.target.value)}
                className="field"
                placeholder="https://…"
              />
            </Field>

            <Field label="Describe the picture" hint="For screen readers and search.">
              <input
                name="imageAlt"
                defaultValue={dessert?.imageAlt ?? ""}
                className="field"
              />
            </Field>
          </div>

          <div className="aspect-4/5 overflow-hidden rounded-2xl border border-blush/60 bg-cloud/50">
            {preview ? (
              // A plain img keeps the preview simple for arbitrary hosts.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center p-4 text-center text-xs text-ink-faint">
                Preview appears here
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── What is in it ─────────────────────────────────── */}
      <Section title="What is in it">
        <Field
          label="Ingredients"
          hint="One per line. Add a note after a dash — like: Medjool dates — our only sweetener."
        >
          <textarea
            name="ingredients"
            rows={10}
            defaultValue={ingredientText}
            className="field resize-y font-mono text-[0.8rem]"
            placeholder={"Medjool dates — our only sweetener\nRaw cacao powder\nAlmond flour"}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Allergens" hint="Separate with commas.">
            <input
              name="allergens"
              defaultValue={parseList(dessert?.allergens).join(", ")}
              className="field"
              placeholder="tree nuts (almond), coconut"
            />
          </Field>
          <Field label="Badges" hint="Shown as little pills. Separate with commas.">
            <input
              name="badges"
              defaultValue={parseList(dessert?.badges).join(", ")}
              className="field"
              placeholder="vegan, gluten-free, no refined sugar"
            />
          </Field>
        </div>

        <Field label="Sweetened with">
          <input
            name="sweetener"
            defaultValue={dessert?.sweetener ?? ""}
            className="field"
            placeholder="Medjool dates and monk fruit"
          />
        </Field>
      </Section>

      {/* ── Nutrition ─────────────────────────────────────── */}
      <Section
        title="Nutrition"
        subtitle="Per serving. Leave anything blank that you do not know — the page simply hides it."
      >
        <Field label="Serving size">
          <input
            name="servingSize"
            defaultValue={dessert?.servingSize ?? ""}
            className="field"
            placeholder="1 slice (1/10 torte, 62 g)"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {NUTRITION_FIELDS.map((field) => (
            <Field key={field.name} label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}>
              <input
                name={field.name}
                type="number"
                step="0.1"
                min="0"
                defaultValue={(dessert?.[field.name] as number | null) ?? ""}
                className="field"
              />
            </Field>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
          <Field label="Glycemic load" hint="Per serving.">
            <input
              name="glycemicLoad"
              type="number"
              step="0.1"
              min="0"
              defaultValue={dessert?.glycemicLoad ?? ""}
              className="field"
            />
          </Field>
          <Field
            label="Blood sugar note"
            hint="Plain English. This is the sentence guests trust most."
          >
            <textarea
              name="glycemicNote"
              rows={3}
              defaultValue={dessert?.glycemicNote ?? ""}
              className="field resize-y"
            />
          </Field>
        </div>
      </Section>

      {/* ── A verse ───────────────────────────────────────── */}
      <Section title="A verse" subtitle="Optional, and shown gently on the page.">
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field label="Verse or blessing">
            <input
              name="scripture"
              defaultValue={dessert?.scripture ?? ""}
              className="field"
            />
          </Field>
          <Field label="Reference">
            <input
              name="scriptureRef"
              defaultValue={dessert?.scriptureRef ?? ""}
              className="field"
              placeholder="Psalm 34:8"
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blush/60 bg-white/90 p-4 backdrop-blur-xl">
        <SubmitButton pendingLabel="Saving…">
          {dessert ? "Save changes" : "Add to the gallery"}
        </SubmitButton>
        <Link href="/admin/desserts" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="card-plinth rounded-2xl p-6 sm:p-7">
      <legend className="px-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </legend>
      {subtitle && (
        <p className="mb-5 mt-1 text-xs text-ink-faint">{subtitle}</p>
      )}
      <div className={subtitle ? "space-y-5" : "mt-5 space-y-5"}>{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">
        {label}
        {required && <span className="text-berry"> *</span>}
      </span>
      {children}
      {hint && <p className="mt-1.5 text-[0.68rem] text-ink-faint">{hint}</p>}
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#ee6f94]"
      />
      {label}
    </label>
  );
}
