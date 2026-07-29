import registry from "./media.json";

export type MediaKey = keyof typeof registry.assets;
export type VideoKey = keyof typeof registry.videos;

/**
 * Brand imagery and video generated with Higgsfield (Nano Banana Pro for
 * stills, Kling 3.0 for the hero loop).
 *
 * By default everything is served from the Higgsfield CDN so the shop looks
 * finished the moment you clone it. For production you want it on your own
 * origin: run `npm run media:download`, then set NEXT_PUBLIC_LOCAL_MEDIA=1 and
 * every reference below switches to /images/… with no other change.
 */
const useLocal = process.env.NEXT_PUBLIC_LOCAL_MEDIA === "1";

export function media(key: MediaKey): string {
  const asset = registry.assets[key];
  return useLocal ? `/images/${asset.file}` : `${registry.cdn}/${asset.remote}`;
}

export function mediaAlt(key: MediaKey): string {
  return registry.assets[key].alt;
}

/**
 * The ambient hero loop. Returns undefined until a clip is registered, so the
 * hero silently falls back to its still image — never a broken player.
 */
export function mediaVideo(key: VideoKey): string | undefined {
  const asset = registry.videos[key];
  if (!asset || asset.remote === "PENDING") return undefined;
  return useLocal ? `/images/${asset.file}` : `${registry.cdn}/${asset.remote}`;
}

export const MEDIA_KEYS = Object.keys(registry.assets) as MediaKey[];
