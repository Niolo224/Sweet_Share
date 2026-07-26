import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import SubmitButton from "@/components/admin/SubmitButton";
import { markMessageReadAction, deleteMessageAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();

  const messages = await prisma.message.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div>
      <h1 className="text-4xl">Messages</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Everything sent through the contact form — catering enquiries,
        questions, and prayer requests.
      </p>

      {messages.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
          No messages yet.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl border p-6 ${
                message.isRead
                  ? "border-blush/50 bg-white/40"
                  : "border-rose/50 bg-gradient-to-br from-cloud to-white shadow-[var(--shadow-plinth)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="badge">{message.topic}</span>
                    {!message.isRead && (
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-berry">
                        New
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2.5 text-xl">
                    {message.subject ?? `Message from ${message.name}`}
                  </h2>
                  <p className="mt-1 text-xs text-ink-faint">
                    {message.name} ·{" "}
                    <a
                      href={`mailto:${message.email}`}
                      className="underline hover:text-berry"
                    >
                      {message.email}
                    </a>
                    {message.phone ? ` · ${message.phone}` : ""} ·{" "}
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                {message.body}
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5 border-t border-blush/50 pt-4">
                <a
                  href={`mailto:${message.email}?subject=${encodeURIComponent(
                    `Re: ${message.subject ?? "your message to Sweet Share"}`,
                  )}`}
                  className="rounded-full bg-gradient-to-r from-rose to-berry px-4 py-2 text-xs text-white"
                >
                  Reply
                </a>

                <form action={markMessageReadAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <SubmitButton
                    className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                    pendingLabel="…"
                  >
                    Mark {message.isRead ? "unread" : "read"}
                  </SubmitButton>
                </form>

                <form action={deleteMessageAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <SubmitButton
                    className="rounded-full border border-berry/40 px-4 py-2 text-xs text-berry transition-colors hover:bg-berry/10"
                    pendingLabel="…"
                    confirm="Delete this message permanently?"
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
