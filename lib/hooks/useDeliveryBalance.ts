import { useState, useEffect, useCallback } from 'react';
import { getBalanceFromCache, setBalanceInCache, removeFromCache } from '@/lib/balanceCache';

interface UseDeliveryBalanceProps {
  invoice_id: number | null;
}

interface UseDeliveryBalanceReturn {
  balance: string | null;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

const parseArgentinianNumber = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  
  try {
    // Handle number input
    if (typeof value === 'number') {
      return value.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // Handle string input
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[^0-9,.-]/g, '');
      const withoutDots = cleanValue.replace(/\./g, '');
      const withPoint = withoutDots.replace(',', '.');
      const number = parseFloat(withPoint);
      
      if (isNaN(number)) return null;
      
      return number.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing balance:', error);
    return null;
  }
};

export const useDeliveryBalance = ({ invoice_id }: UseDeliveryBalanceProps): UseDeliveryBalanceReturn => {
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalance = useCallback(async (skipCache = false) => {
    if (!invoice_id) return;

    // Check cache unless skipCache is true
    if (!skipCache) {
      const cachedBalance = getBalanceFromCache(invoice_id);
      if (cachedBalance !== undefined) {
        const formattedBalance = parseArgentinianNumber(cachedBalance);
        setBalance(formattedBalance);
        setError(null);
        return;
      }
    }

    try {
      const response = await fetch(`/api/invoices/${invoice_id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && 'Saldo' in data) {
        const formattedBalance = parseArgentinianNumber(data.Saldo);
        if (formattedBalance !== null) {
          setBalance(formattedBalance);
          setBalanceInCache(invoice_id, formattedBalance);
          setError(null);
          return;
        }
      }
      
      throw new Error('Invalid balance data received');
      
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('No se encontró la factura y no conocemos el saldo pendiente. Recargá la página.');
      setBalance(null);
    }
  }, [invoice_id]);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (invoice_id) {
        removeFromCache(invoice_id);
        await fetchBalance(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [invoice_id, fetchBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    error,
    isRefreshing,
    refetch
  };
};