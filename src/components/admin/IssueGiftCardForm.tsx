"use client";

import { useActionState } from "react";
import { issueGiftCardAction, type ActionState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

export default function IssueGiftCardForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    issueGiftCardAction,
    null,
  );

  return (
    <form action={formAction} className="card-plinth space-y-5 rounded-2xl p-6">
      <div>
        <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Issue a card by hand
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          For an apology, a prize, or a family you want to feed. No money
          changes hands — it is active straight away.
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
        <label className="label" htmlFor="gc-amount">
          Amount
        </label>
        <input
          id="gc-amount"
          name="amount"
          type="number"
          step="0.01"
          min="10"
          max="500"
          required
          className="field"
          placeholder="25.00"
        />
      </div>

      <div>
        <label className="label" htmlFor="gc-name">
          Their name
        </label>
        <input id="gc-name" name="recipientName" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="gc-email">
          Their email
        </label>
        <input
          id="gc-email"
          name="recipientEmail"
          type="email"
          className="field"
          placeholder="Leave blank to keep the code to yourself"
        />
      </div>

      <div>
        <label className="label" htmlFor="gc-message">
          A note
        </label>
        <textarea
          id="gc-message"
          name="message"
          rows={3}
          maxLength={500}
          className="field resize-y"
        />
      </div>

      <SubmitButton pendingLabel="Issuing…">Issue card</SubmitButton>
    </form>
  );
}
