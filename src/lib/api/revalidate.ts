"use server";

import { revalidateTag, updateTag } from "next/cache";
import { CacheTag } from "./server";

// Server Action to revalidate public data cache tags after mutations in the internal area.
export async function revalidatePublicData(tag: CacheTag): Promise<void> {
  try {
    updateTag(tag);
  } catch {
    revalidateTag(tag, { expire: 0 });
  }
}
