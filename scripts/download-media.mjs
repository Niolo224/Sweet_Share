#!/usr/bin/env node
/**
 * Pull the brand imagery onto your own origin.
 *
 *   npm run media:download
 *
 * Then add NEXT_PUBLIC_LOCAL_MEDIA=1 to .env and the site serves everything
 * from /public/images instead of the Higgsfield CDN.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(
  readFileSync(path.join(root, "src/lib/media.json"), "utf8"),
);
const outDir = path.join(root, "public/images");

await mkdir(outDir, { recursive: true });

let downloaded = 0;
let skipped = 0;

for (const [key, asset] of Object.entries(registry.assets)) {
  const target = path.join(outDir, asset.file);

  try {
    await access(target);
    console.log(`· ${asset.file} — already here`);
    skipped += 1;
    continue;
  } catch {
    // Not downloaded yet; carry on.
  }

  const url = `${registry.cdn}/${asset.remote}`;
  process.stdout.write(`↓ ${asset.file} … `);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`failed (HTTP ${response.status})`);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(target, bytes);
    console.log(`${(bytes.length / 1024 / 1024).toFixed(1)} MB`);
    downloaded += 1;
  } catch (error) {
    console.log(`failed — ${error.message}`);
    console.log(`  (key: ${key})`);
  }
}

console.log(
  `\nDone. ${downloaded} downloaded, ${skipped} already present.\n` +
    `Set NEXT_PUBLIC_LOCAL_MEDIA=1 in .env to serve them locally.`,
);
