const TONES: Record<string, string> = {
  pending: "bg-gold/20 text-plum",
  confirmed: "bg-lavender-soft text-plum",
  baking: "bg-peach/40 text-plum",
  ready: "bg-cloud-2 text-plum",
  fulfilled: "bg-white text-ink-faint",
  cancelled: "bg-berry/10 text-berry",
  paid: "bg-cloud-2 text-plum",
  unpaid: "bg-gold/20 text-plum",
  refunded: "bg-berry/10 text-berry",
  approved: "bg-cloud-2 text-plum",
  rejected: "bg-berry/10 text-berry",
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.1em] ${
        TONES[status] ?? "bg-cloud text-ink-soft"
      }`}
    >
      {status}
    </span>
  );
}
