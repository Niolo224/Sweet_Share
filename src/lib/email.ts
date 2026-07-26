/**
 * Transactional email.
 *
 * With RESEND_API_KEY set, mail is sent through Resend. Without it, messages
 * are logged to the server console so the whole ordering flow still works in
 * development and nothing silently fails in production.
 */

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL ?? "Sweet Share <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[email] Not sent — RESEND_API_KEY is unset.\n  to: ${
        Array.isArray(to) ? to.join(", ") : to
      }\n  subject: ${subject}`,
    );
    return { ok: false as const, skipped: true as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      console.error("[email] Resend rejected the message:", await response.text());
      return { ok: false as const, skipped: false as const };
    }
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("[email] Could not reach Resend:", error);
    return { ok: false as const, skipped: false as const };
  }
}

/** A warm, plain wrapper so every email looks like it came from the shop. */
export function emailShell(heading: string, body: string) {
  return `
  <div style="margin:0;padding:32px 16px;background:#fff6f8;font-family:Georgia,'Times New Roman',serif;color:#45213a;">
    <div style="max-width:560px;margin:0 auto;background:#fffaf4;border:1px solid #f9c4d4;border-radius:18px;padding:36px 32px;">
      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#ee6f94;">Sweet Share</p>
      <h1 style="margin:0 0 18px;font-size:28px;font-weight:400;line-height:1.2;">${heading}</h1>
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#6d3f5c;">${body}</div>
      <hr style="margin:28px 0 16px;border:none;border-top:1px solid #f9c4d4;" />
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#a37c93;">
        Baked without dairy, eggs or refined sugar — made to be shared.<br/>
        <em>“Taste and see that the Lord is good.” — Psalm 34:8</em>
      </p>
    </div>
  </div>`;
}
