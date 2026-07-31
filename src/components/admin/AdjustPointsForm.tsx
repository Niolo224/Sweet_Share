"use client";

import { useActionState } from "react";
import { adjustPointsAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

export default function AdjustPointsForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    adjustPointsAction,
    null,
  );

  return (
    <form action={formAction} className="card-plinth space-y-5 rounded-2xl p-6">
      <div>
        <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Adjust points
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          For an apology or a correction. A negative number takes points away.
          If the address has never ordered, an account is created for it.
        </p>
      </div>

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

      <div>
        <label className="label" htmlFor="lp-email">
          Email
        </label>
        <input id="lp-email" name="email" type="email" required className="field" />
      </div>

      <div>
        <label className="label" htmlFor="lp-points">
          Points
        </label>
        <input
          id="lp-points"
          name="points"
          type="number"
          step="1"
          required
          className="field"
          placeholder="50 or -50"
        />
      </div>

      <div>
        <label className="label" htmlFor="lp-note">
          Why
        </label>
        <input
          id="lp-note"
          name="note"
          className="field"
          placeholder="Late delivery, apology"
        />
      </div>

      <SubmitButton pendingLabel="Adjusting…">Adjust</SubmitButton>
    </form>
  );
}
