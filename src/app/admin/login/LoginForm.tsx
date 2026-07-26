"use client";

import { useActionState } from "react";
import { signInAction, type ActionState } from "../actions";
import SubmitButton from "@/components/admin/SubmitButton";

export default function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={formAction} className="mt-7 space-y-4">
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="field"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {state.error}
        </p>
      )}

      <SubmitButton className="btn btn-primary btn-sheen w-full" pendingLabel="Opening…">
        Come in
      </SubmitButton>
    </form>
  );
}
