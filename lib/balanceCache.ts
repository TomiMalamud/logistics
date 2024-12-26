// balanceCache.ts
interface CacheEntry {
  balance: string;
  timestamp: number;
}

type BalanceCache = Map<number, CacheEntry>;

const CACHE_TTL = {
  DEFAULT: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  POSITIVE_BALANCE: 5 * 60 * 1000,    // 5 minutes in milliseconds
} as const;

const balanceCache: BalanceCache = new Map();

const parseBalance = (value: string): number => 
  parseFloat(value.replace(',', '.'));

const isExpired = (entry: CacheEntry): boolean => {
  const now = Date.now();
  const ttl = parseBalance(entry.balance) > 0 
    ? CACHE_TTL.POSITIVE_BALANCE 
    : CACHE_TTL.DEFAULT;
  
  return now - entry.timestamp >= ttl;
};

const getCacheKey = (invoice_id: number): string =>
  `saldo_${invoice_id}`;

export const getBalanceFromCache = (invoice_id: number): string | undefined => {
  const entry = balanceCache.get(invoice_id);
  
  if (!entry) {
    return undefined;
  }

  if (isExpired(entry)) {
    removeFromCache(invoice_id);
    return undefined;
  }

  return entry.balance;
};

export const setBalanceInCache = (invoice_id: number, balance: string): void => {
  const entry: CacheEntry = {
    balance,
    timestamp: Date.now(),
  };

  balanceCache.set(invoice_id, entry);

  // Only persist to localStorage if balance is zero
  if (balance === "0,00") {
    try {
      localStorage.setItem(
        getCacheKey(invoice_id), 
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }
};

export const removeFromCache = (invoice_id: number): void => {
  balanceCache.delete(invoice_id);
  localStorage.removeItem(getCacheKey(invoice_id));
};

export const loadPersistentCache = (): void => {
  if (typeof window === 'undefined') return;

  const cacheEntries = Object.entries(localStorage)
    .filter(([key]) => key.startsWith('saldo_'))
    .map(([key, value]): [number, CacheEntry] | null => {
      try {
        const invoice_id = parseInt(key.replace('saldo_', ''), 10);
        const entry: CacheEntry = JSON.parse(value);
        return [invoice_id, entry];
      } catch (error) {
        console.error(`Failed to parse cache for ${key}:`, error);
        localStorage.removeItem(key);
        return null;
      }
    })
    .filter((entry): entry is [number, CacheEntry] => entry !== null);

  cacheEntries.forEach(([invoice_id, entry]) => {
    balanceCache.set(invoice_id, entry);
  });
};