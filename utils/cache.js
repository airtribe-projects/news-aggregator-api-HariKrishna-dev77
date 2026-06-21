// Simple in-memory cache with TTL (Time To Live)
// Reduces NewsAPI calls by caching results per query key

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in ms

// ─── Set cache ────────────────────────────────────────────────────────────────
const setCache = (key, data, ttl = DEFAULT_TTL) => {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttl
    });
    console.log(`[Cache] SET → key: "${key}" | expires in ${ttl / 1000}s`);
};

// ─── Get cache ────────────────────────────────────────────────────────────────
const getCache = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        console.log(`[Cache] EXPIRED → key: "${key}"`);
        return null;
    }

    console.log(`[Cache] HIT → key: "${key}"`);
    return entry.data;
};

// ─── Delete cache ─────────────────────────────────────────────────────────────
const deleteCache = (key) => {
    cache.delete(key);
};

// ─── Clear all cache ──────────────────────────────────────────────────────────
const clearCache = () => {
    cache.clear();
    console.log('[Cache] All cache cleared');
};

// ─── Build a cache key ────────────────────────────────────────────────────────
const buildCacheKey = (prefix, ...parts) => {
    return `${prefix}:${parts.join('_')}`;
};

// ─── Periodic cache update (every 10 min) ─────────────────────────────────────
// Simulates real-time aggregator — clears stale cache so next request refetches
const startPeriodicCacheCleanup = (intervalMs = 10 * 60 * 1000) => {
    setInterval(() => {
        let removed = 0;
        for (const [key, entry] of cache.entries()) {
            if (Date.now() > entry.expiresAt) {
                cache.delete(key);
                removed++;
            }
        }
        console.log(`[Cache] Periodic cleanup — removed ${removed} expired entries`);
    }, intervalMs);
};

module.exports = {
    setCache,
    getCache,
    deleteCache,
    clearCache,
    buildCacheKey,
    startPeriodicCacheCleanup
};