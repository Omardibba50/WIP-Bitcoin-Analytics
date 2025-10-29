/**
 * Lightning Network Service
 * Fetches real-time Lightning Network statistics
 * Data sources: mempool.space, 1ml.com
 */

// Cache to prevent excessive API calls
let lightningCache = {
  data: null,
  timestamp: 0,
  ttl: 300000 // 5 minutes cache
};

/**
 * Fetch Lightning Network statistics from mempool.space
 */
export async function fetchLightningNetworkStats() {
  try {
    // Check cache first
    const now = Date.now();
    if (lightningCache.data && (now - lightningCache.timestamp) < lightningCache.ttl) {
      console.log('✅ Returning cached Lightning Network data');
      return lightningCache.data;
    }

    console.log('🔄 Fetching Lightning Network statistics...');

    // Fetch latest snapshot from mempool.space
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const latestRes = await fetch('https://mempool.space/api/v1/lightning/statistics/latest', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!latestRes.ok) {
      throw new Error(`HTTP ${latestRes.status}: ${latestRes.statusText}`);
    }

    const latestJson = await latestRes.json();
    const latest = latestJson.latest || latestJson;

    // Fetch historical capacity series (use a safe default timespan, e.g., 180 days)
    let capacityHistory = [];
    try {
      const histController = new AbortController();
      const histTimeoutId = setTimeout(() => histController.abort(), 15000);
      const histRes = await fetch('https://mempool.space/api/v1/lightning/statistics/2?period=180d', { signal: histController.signal });
      clearTimeout(histTimeoutId);
      if (histRes.ok) {
        const histJson = await histRes.json();
        // Expect an array of points; be robust to alternative shapes
        const series = Array.isArray(histJson) ? histJson : (histJson.series || histJson.data || []);
        const toMs = (ts) => (ts != null && ts < 1e12 ? ts * 1000 : ts);
        capacityHistory = series
          .map(d => {
            // Support common shapes: {timestamp|time|t|date}, value under {total_capacity|capacity|value|v}
            const rawTs = (d.timestamp ?? d.time ?? d.t ?? (d.date ? Date.parse(d.date) : null));
            const tsMs = toMs(Number(rawTs));
            const sats = (d.total_capacity ?? d.capacity ?? d.value ?? d.v ?? null);
            const capBtc = sats != null ? Number(sats) / 1e8 : null;
            return { timestamp: tsMs, capacity: capBtc };
          })
          .filter(d => Number.isFinite(d.timestamp) && Number.isFinite(d.capacity))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (!capacityHistory.length) {
          console.warn('LN history empty; sample:', Array.isArray(series) && series.length ? series[0] : series);
        }
      } else {
        console.warn('Lightning history fetch failed with status', histRes.status);
      }
    } catch (e) {
      console.warn('Lightning history fetch error:', e.message);
    }

    // Transform latest to our format
    const stats = {
      totalCapacity: latest.total_capacity ? latest.total_capacity / 100000000 : 0, // sats->BTC
      totalCapacityUSD: 0, // filled in by controller
      totalNodes: latest.node_count || 0,
      totalChannels: latest.channel_count || 0,
      torCapacity: latest.tor_nodes && latest.avg_capacity ? (latest.tor_nodes * latest.avg_capacity) / 100000000 : 0,
      torNodes: latest.tor_nodes || 0,
      clearnetNodes: latest.clearnet_nodes || 0,
      unannouncedNodes: latest.unannounced_nodes || 0,
      avgCapacity: latest.avg_capacity ? latest.avg_capacity / 100000000 : 0,
      avgChannelSize: latest.avg_channel_size ? latest.avg_channel_size / 100000000 : 0,
      medianCapacity: latest.med_capacity ? latest.med_capacity / 100000000 : 0,
      medianChannelSize: latest.med_channel_size ? latest.med_channel_size / 100000000 : 0,
      timestamp: now,
      capacityHistory
    };

    // Calculate Tor percentage
    stats.torCapacityPercentage = (stats.totalCapacity > 0 && stats.torCapacity > 0)
      ? (stats.torCapacity / stats.totalCapacity) * 100
      : 0;

    console.log(`✅ Lightning Network stats fetched successfully`);
    console.log(`   Total Capacity: ${stats.totalCapacity.toFixed(2)} BTC`);
    console.log(`   History points: ${stats.capacityHistory.length}`);

    // Update cache only if we have useful data (avoid caching empty history)
    if (stats.capacityHistory && stats.capacityHistory.length) {
      lightningCache.data = stats;
      lightningCache.timestamp = now;
    } else {
      // Still return stats, but don't cache to allow retries soon
      console.warn('Skipping cache update due to empty capacityHistory');
    }

    return stats;

  } catch (error) {
    console.error('❌ Failed to fetch Lightning Network stats:', error.message);

    // Return cached data if available, even if expired
    if (lightningCache.data) {
      console.log('⚠️  Returning stale cached data');
      return lightningCache.data;
    }

    return null;
  }
}

/**
 * Calculate Lightning Network metrics with BTC price
 */
export function calculateLightningMetrics(stats, btcPriceUSD) {
  if (!stats) return null;

  return {
    ...stats,
    totalCapacityUSD: stats.totalCapacity * btcPriceUSD,
    torCapacityUSD: stats.torCapacity * btcPriceUSD,
    avgCapacityUSD: stats.avgCapacity * btcPriceUSD,
    avgChannelSizeUSD: stats.avgChannelSize * btcPriceUSD
  };
}
