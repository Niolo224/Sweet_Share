import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { slugify } from "./utils";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Store an uploaded file and return a public URL.
 *
 * Two backends, chosen automatically:
 *   • Vercel Blob, when BLOB_READ_WRITE_TOKEN is present — the right answer in
 *     production, where the filesystem is read-only and ephemeral.
 *   • The local public/uploads folder otherwise, so development just works.
 */
export async function storeUpload(file: File): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "No file received." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "That file is larger than 8 MB." };
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return {
      ok: false,
      error: "Please upload a JPG, PNG, WebP, AVIF, GIF or PDF.",
    };
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "upload";
  const filename = `${base}-${Date.now().toString(36)}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Imported lazily so it only loads when blob storage is configured.
      const { put } = await import("@vercel/blob");
      const blob = await put(`sweet-share/${filename}`, bytes, {
        access: "public",
        contentType: file.type,
      });
      return { ok: true, url: blob.url };
    } catch {
      return {
        ok: false,
        error:
          "Blob storage is configured but unavailable. Run `npm i @vercel/blob` and check BLOB_READ_WRITE_TOKEN.",
      };
    }
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    return { ok: true, url: `/uploads/${filename}` };
  } catch {
    return {
      ok: false,
      error:
        "Could not write to public/uploads. On a read-only host, set BLOB_READ_WRITE_TOKEN instead.",
    };
  }
}
