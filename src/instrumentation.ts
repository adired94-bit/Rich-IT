export async function onRequestError(err: unknown) {
  // Temporary diagnostic: Next.js redacts Server Component error messages from
  // the client in production, so log the untruncated error server-side where
  // the platform's request logs can capture it.
  console.error("RICH_IT_DIAGNOSTIC_REQUEST_ERROR", err);
}
