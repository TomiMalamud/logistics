// balanceCache.ts
interface CacheEntry {
  saldo: string;
  timestamp: number;
}

const saldoCache: Record<number, CacheEntry> = {};

const CACHE_TTL_DEFAULT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const CACHE_TTL_SALDO_POSITIVE = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getSaldoFromCache = (invoice_id: number): string | undefined => {
  const entry = saldoCache[invoice_id];
  if (!entry) return undefined;

  const now = Date.now();
  const isSaldoPositive = parseFloat(entry.saldo.replace(',', '.')) > 0;
  const ttl = isSaldoPositive ? CACHE_TTL_SALDO_POSITIVE : CACHE_TTL_DEFAULT;

  if (now - entry.timestamp < ttl) {
    return entry.saldo;
  } else {
    removeFromCache(invoice_id);
    return undefined;
  }
};

export const setSaldoInCache = (invoice_id: number, saldo: string): void => {
  const entry: CacheEntry = {
    saldo,
    timestamp: Date.now(),
  };
  saldoCache[invoice_id] = entry;

  if (saldo === "0,00") {
    const persistentEntry = JSON.stringify(entry);
    localStorage.setItem(`saldo_${invoice_id}`, persistentEntry);
  }
};

export const removeFromCache = (invoice_id: number): void => {
  delete saldoCache[invoice_id];
  localStorage.removeItem(`saldo_${invoice_id}`);
};

export const loadPersistentCache = (): void => {
  if (typeof window === 'undefined') return;

  Object.keys(localStorage)
    .filter(key => key.startsWith('saldo_'))
    .forEach(key => {
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
    });
};