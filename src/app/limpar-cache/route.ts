import { revalidateTag } from "next/cache";
import { API_URL, CACHE_TAGS } from "@/lib/api/server";

// Clears the cached public data. The internal area revalidates one tag after
// each change it makes, but the end-to-end suite also changes the database
// straight through the API and restores it at the end, which no tag follows.
// Only a token the Backend accepts may call it, so visitors cannot keep the
// site hitting the Backend.
export async function POST(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return new Response(null, { status: 401 });

  const session = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });
  if (!session.ok) return new Response(null, { status: 401 });

  for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag, { expire: 0 });
  return new Response(null, { status: 204 });
}
