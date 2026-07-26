"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  dessertId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
  unitLabel: string;
  leadTimeDays: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  /** The longest lead time in the basket decides the earliest date. */
  leadTimeDays: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (dessertId: string, quantity: number) => void;
  remove: (dessertId: string) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = "sweetshare.basket.v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount so server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      // A corrupt basket should never break the shop.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing, quota — not worth interrupting the guest.
    }
  }, [lines, ready]);

  const add = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((l) => l.dessertId === line.dessertId);
        if (existing) {
          return current.map((l) =>
            l.dessertId === line.dessertId
              ? { ...l, quantity: Math.min(99, l.quantity + quantity) }
              : l,
          );
        }
        return [...current, { ...line, quantity }];
      });
    },
    [],
  );

  const setQuantity = useCallback((dessertId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.dessertId !== dessertId)
        : current.map((l) =>
            l.dessertId === dessertId
              ? { ...l, quantity: Math.min(99, quantity) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback((dessertId: string) => {
    setLines((current) => current.filter((l) => l.dessertId !== dessertId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalCents = lines.reduce(
      (sum, l) => sum + l.priceCents * l.quantity,
      0,
    );
    const leadTimeDays = lines.reduce(
      (max, l) => Math.max(max, l.leadTimeDays ?? 2),
      2,
    );
    return {
      lines,
      count,
      subtotalCents,
      leadTimeDays,
      add,
      setQuantity,
      remove,
      clear,
      ready,
    };
  }, [lines, add, setQuantity, remove, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider.");
  }
  return context;
}
