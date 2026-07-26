import registry from "./media.json";

export type MediaKey = keyof typeof registry.assets;

/**
 * Brand imagery generated with Higgsfield (Nano Banana Pro).
 *
 * By default the images are served from the Higgsfield CDN so the shop looks
 * finished the moment you clone it. For production you want them on your own
 * origin: run `npm run media:download`, then set NEXT_PUBLIC_LOCAL_MEDIA=1 and
 * every reference below switches to /images/… with no other change.
 */
const useLocal = process.env.NEXT_PUBLIC_LOCAL_MEDIA === "1";

export function media(key: MediaKey): string {
  const asset = registry.assets[key];
  return useLocal
    ? `/images/${asset.file}`
    : `${registry.cdn}/${asset.remote}`;
}

export function mediaAlt(key: MediaKey): string {
  return registry.assets[key].alt;
}

export const MEDIA_KEYS = Object.keys(registry.assets) as MediaKey[];
