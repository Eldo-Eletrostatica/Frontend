// The commit this deploy runs, which Render sets in RENDER_GIT_COMMIT. The
// end-to-end workflow waits for it to match the commit that was just merged,
// so the suite never tests the previous version while Render is deploying.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ commit: process.env.RENDER_GIT_COMMIT ?? null });
}
