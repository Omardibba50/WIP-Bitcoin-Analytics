import fetch from "node-fetch";

let cache = {};
let lastFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchCachedCoinGecko(url) {
  const now = Date.now();

  // If cached and still fresh, use it
  if (cache[url] && now - lastFetch < CACHE_TTL) {
    console.log("♻️ Using cached CoinGecko data for", url);
    return cache[url];
  }

  try {
    console.log("🌐 Fetching new CoinGecko data...");
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    cache[url] = data;
    lastFetch = now;
    console.log("✅ Updated CoinGecko cache");
    return data;
  } catch (err) {
    console.error("⚠️ CoinGecko fetch failed:", err.message);
    if (cache[url]) {
      console.log("♻️ Returning cached data due to error");
      return cache[url];
    }
    throw err;
  }
}
