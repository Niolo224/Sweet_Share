"use client";

import { useActionState } from "react";
import { saveSettingsAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

type Field = {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
};

const GROUPS: Array<{ heading: string; blurb: string; fields: Field[] }> = [
  {
    heading: "The banner",
    blurb: "The thin strip at the very top of every page.",
    fields: [
      {
        key: "announcement",
        label: "Announcement",
        hint: "Leave blank to hide the banner entirely.",
      },
    ],
  },
  {
    heading: "The front page",
    blurb: "The first thing anybody sees.",
    fields: [
      { key: "heroEyebrow", label: "Small line above the title" },
      { key: "heroTitle", label: "Big title" },
      { key: "heroSubtitle", label: "Subtitle", multiline: true },
      { key: "heroVerse", label: "Verse" },
      { key: "heroVerseRef", label: "Verse reference" },
    ],
  },
  {
    heading: "Story & mission",
    blurb: "Shown on the home page and the story page.",
    fields: [
      { key: "missionTitle", label: "Mission heading" },
      { key: "missionBody", label: "Mission", multiline: true },
      { key: "storyTitle", label: "Story page heading" },
    ],
  },
  {
    heading: "Ordering",
    blurb: "What guests read on the order page.",
    fields: [
      { key: "orderNote", label: "Note at the top of the order page", multiline: true },
      { key: "pickupAddress", label: "Collection note", multiline: true },
      { key: "minimumLeadDays", label: "Fewest days of notice" },
    ],
  },
  {
    heading: "How to reach you",
    blurb: "Shown in the footer and on the contact page. Blanks are hidden.",
    fields: [
      { key: "contactEmail", label: "Email" },
      { key: "contactPhone", label: "Phone" },
      { key: "instagram", label: "Instagram link" },
      { key: "facebook", label: "Facebook link" },
    ],
  },
];

export default function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveSettingsAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-rose/40 bg-cloud/60 px-4 py-3 text-sm text-plum">
          {state.success}
        </p>
      )}

      {GROUPS.map((group) => (
        <fieldset key={group.heading} className="card-plinth rounded-2xl p-6 sm:p-7">
          <legend
            className="px-2 text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {group.heading}
          </legend>
          <p className="mb-5 mt-1 text-xs text-ink-faint">{group.blurb}</p>

          <div className="space-y-5">
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="label" htmlFor={field.key}>
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    id={field.key}
                    name={field.key}
                    rows={3}
                    defaultValue={settings[field.key] ?? ""}
                    className="field resize-y"
                  />
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    defaultValue={settings[field.key] ?? ""}
                    className="field"
                  />
                )}
                {field.hint && (
                  <p className="mt-1.5 text-[0.68rem] text-ink-faint">
                    {field.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-4 rounded-2xl border border-blush/60 bg-white/90 p-4 backdrop-blur-xl">
        <SubmitButton pendingLabel="Saving…">Save site copy</SubmitButton>
      </div>
    </form>
  );
}
