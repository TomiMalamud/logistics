// saldoCache.ts

interface CacheEntry {
  saldo: string; // Changed to string to match component state
  timestamp: number; // Unix timestamp in milliseconds
}

// Keys will be the id_comprobante
const saldoCache: Record<number, CacheEntry> = {};

// Constants for TTL (Time To Live)
const CACHE_TTL_DEFAULT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const CACHE_TTL_SALDO_POSITIVE = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get Saldo from Cache
 * @param id_comprobante
 * @returns saldo if cached and valid, else undefined
 */
export const getSaldoFromCache = (id_comprobante: number): string | undefined => {
  const entry = saldoCache[id_comprobante];
  if (!entry) return undefined;

  const now = Date.now();
  const isSaldoPositive = parseFloat(entry.saldo.replace(',', '.')) > 0;
  const ttl = isSaldoPositive ? CACHE_TTL_SALDO_POSITIVE : CACHE_TTL_DEFAULT;

  if (now - entry.timestamp < ttl) {
    return entry.saldo;
  } else {
    // Cache expired
    delete saldoCache[id_comprobante];
    removeFromPersistentCache(id_comprobante);
    return undefined;
  }
};

/**
 * Set Saldo in Cache
 * @param id_comprobante
 * @param saldo
 */
export const setSaldoInCache = (id_comprobante: number, saldo: string): void => {
  const entry: CacheEntry = {
    saldo,
    timestamp: Date.now(),
  };
  saldoCache[id_comprobante] = entry;

  if (saldo === "0,00") {
    // Persist in localStorage for long-term caching
    const persistentEntry = JSON.stringify(entry);
    localStorage.setItem(`saldo_${id_comprobante}`, persistentEntry);
  }
};

/**
 * Load persistent cache from localStorage on app start
 */
export const loadPersistentCache = (): void => {
  if (typeof window === 'undefined') return; // Ensure this runs only on the client

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('saldo_')) {
      const id_comprobante = parseInt(key.replace('saldo_', ''), 10);
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const entry: CacheEntry = JSON.parse(data);
          saldoCache[id_comprobante] = entry;
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
 * @param id_comprobante
 */
const removeFromPersistentCache = (id_comprobante: number): void => {
  localStorage.removeItem(`saldo_${id_comprobante}`);
};
