import Link from "next/link";
import SparkleField from "@/components/SparkleField";

export default function NotFound() {
  return (
    <section className="light-shaft relative grid min-h-[70svh] place-items-center overflow-hidden py-24">
      <SparkleField count={24} />

      <div className="shell relative text-center">
        <p className="eyebrow">Nothing on this pedestal</p>
        <h1 className="mt-4 text-[clamp(3rem,10vw,7rem)] leading-none">
          <span className="text-shimmer">404</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-soft">
          This page has either been eaten or was never baked. Both happen here.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/gallery" className="btn btn-primary btn-sheen">
            Back to the gallery
          </Link>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
