"use server";

import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";
import { API_URL, CACHE_TAGS, type CacheTag } from "./server";
import { SESSION_COOKIE } from "./cookies";

const PUBLIC_DATA_TAGS: readonly string[] = Object.values(CACHE_TAGS);

// A Server Action can be called by any visitor, so it only runs for a session
// the Backend accepts; otherwise anyone could flush the site cache over and
// over and make every page hit the Backend again.
async function hasValidSession(): Promise<boolean> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return false;
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `${SESSION_COOKIE}=${session}` },
    cache: "no-store",
  });
  return response.ok;
}

// Called by the internal area after a change, so the public site shows it at once.
export async function revalidatePublicData(tag: CacheTag): Promise<void> {
  if (!PUBLIC_DATA_TAGS.includes(tag) || !(await hasValidSession())) {
    throw new Error("Sessão inválida para atualizar o site.");
  }
  try {
    updateTag(tag);
  } catch {
    revalidateTag(tag, { expire: 0 });
  }
}
