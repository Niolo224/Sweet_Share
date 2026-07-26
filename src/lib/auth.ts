import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "sweetshare_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // twelve hours at the counter

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to a long random string in production.",
      );
    }
    return "sweet-share-development-only-secret";
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

/** Constant-time compare so a wrong guess never leaks timing information. */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

function createToken() {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresAt, signature] = parts;
  if (role !== "admin") return false;
  if (!safeEqual(signature, sign(`${role}.${expiresAt}`))) return false;
  return Number(expiresAt) > Date.now();
}

export async function startSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isSignedIn() {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

/** Use at the top of every admin page and mutating admin route. */
export async function requireAdmin() {
  if (!(await isSignedIn())) redirect("/admin/login");
}
