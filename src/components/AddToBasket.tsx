"use client";

import { useState } from "react";
import { useCart, type CartLine } from "./CartProvider";

type Props = {
  line: Omit<CartLine, "quantity">;
  className?: string;
  label?: string;
  withQuantity?: boolean;
};

export default function AddToBasket({
  line,
  className = "btn btn-primary btn-sheen w-full",
  label = "Add to basket",
  withQuantity = false,
}: Props) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function onAdd() {
    add(line, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className={withQuantity ? "flex flex-col gap-3 sm:flex-row" : ""}>
      {withQuantity && (
        <div className="flex items-center gap-1 rounded-full border border-blush bg-white/70 px-2">
          <button
            type="button"
            aria-label="Fewer"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="grid h-10 w-10 place-items-center rounded-full text-lg text-ink-soft transition-colors hover:bg-cloud hover:text-berry"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="w-8 text-center text-sm font-medium tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="More"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="grid h-10 w-10 place-items-center rounded-full text-lg text-ink-soft transition-colors hover:bg-cloud hover:text-berry"
          >
            +
          </button>
        </div>
      )}

      <button type="button" onClick={onAdd} className={className}>
        {added ? "Added — bless you" : label}
      </button>
    </div>
  );
}
