// saldoCache.ts

interface CacheEntry {
  saldo: string; 
  timestamp: number;
}

// Keys will be the invoice_id
const saldoCache: Record<number, CacheEntry> = {};

// Constants for TTL (Time To Live)
const CACHE_TTL_DEFAULT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const CACHE_TTL_SALDO_POSITIVE = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get Saldo from Cache
 * @param invoice_id
 * @returns saldo if cached and valid, else undefined
 */
export const getSaldoFromCache = (invoice_id: number): string | undefined => {
  const entry = saldoCache[invoice_id];
  if (!entry) return undefined;

  const now = Date.now();
  const isSaldoPositive = parseFloat(entry.saldo.replace(',', '.')) > 0;
  const ttl = isSaldoPositive ? CACHE_TTL_SALDO_POSITIVE : CACHE_TTL_DEFAULT;

  if (now - entry.timestamp < ttl) {
    return entry.saldo;
  } else {
    // Cache expired
    delete saldoCache[invoice_id];
    removeFromPersistentCache(invoice_id);
    return undefined;
  }
};

/**
 * Set Saldo in Cache
 * @param invoice_id
 * @param saldo
 */
export const setSaldoInCache = (invoice_id: number, saldo: string): void => {
  const entry: CacheEntry = {
    saldo,
    timestamp: Date.now(),
  };
  saldoCache[invoice_id] = entry;

  if (saldo === "0,00") {
    // Persist in localStorage for long-term caching
    const persistentEntry = JSON.stringify(entry);
    localStorage.setItem(`saldo_${invoice_id}`, persistentEntry);
  }
};

/**
 * Load persistent cache from localStorage on app start
 */
export const loadPersistentCache = (): void => {
  if (typeof window === 'undefined') return; // Ensure this runs only on the client

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('saldo_')) {
      const invoice_id = parseInt(key.replace('saldo_', ''), 10);
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const entry: CacheEntry = JSON.parse(data);
          saldoCache[invoice_id] = entry;
        } catch (error) {
          console.error(`Failed to parse cache for ${key}:`, error);
          localStorage.removeItem(key);
        }
      }
    }
  });
};

/**
 * Remove entry from persistent cache
 * @param invoice_id
 */
const removeFromPersistentCache = (invoice_id: number): void => {
  localStorage.removeItem(`saldo_${invoice_id}`);
};
