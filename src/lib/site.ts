export const siteDomain = "kevinmata.dev";

// Cloudflare Web Analytics.
export const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? `https://${siteDomain}` : "http://localhost:3000")
).replace(/\/$/, "");
