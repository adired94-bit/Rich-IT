// Netlify scheduled function: replaces the Vercel cron in vercel.json.
// 05:00 UTC = 08:00 Israel summer time / 07:00 winter time.
const morningDigest = async () => {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error("[morning-digest] missing URL or CRON_SECRET");
    return;
  }
  const res = await fetch(`${base}/api/cron/morning-digest`, { headers: { authorization: `Bearer ${secret}` } });
  console.log("[morning-digest]", res.status, await res.text());
};

export default morningDigest;

export const config = { schedule: "0 5 * * *" };
