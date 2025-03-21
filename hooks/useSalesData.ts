// hooks/useSalesData.ts
import { Comprobante, SearchComprobanteResponse } from "@/types/api";
import { useEffect, useState } from "react";

export type PeriodOption = "this-month" | "last-month" | "last-3-months";

interface SalesDataPoint {
  date: string;
  sales: number;
}

export interface ProcessedSalesData {
  dailyData: SalesDataPoint[];
  recentSales: Array<{
    id: number;
    date: string;
    amount: number;
    customer: string;
  }>;
  totalSales: number;
  projectedSales?: number; // Add projection
}

const parseArgAmount = (amount: string): number => {
  if (!amount || amount === "") return 0;
  try {
    const cleanAmount = amount.replace(/[^\d.,\-]/g, "");
    const normalized = cleanAmount.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error(`Error parsing amount: ${amount}`, error);
    return 0;
  }
};

const getLocalDateFromISO = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error parsing date: ${isoDate}`, error);
    return isoDate.split("T")[0];
  }
};

const getDateRange = (period: PeriodOption) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  switch (period) {
    case "this-month":
      return {
        start: formatDate(firstDayOfMonth),
        end: formatDate(now),
      };
    case "last-month":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: formatDate(lastMonthStart),
        end: formatDate(lastMonthEnd),
      };
    case "last-3-months":
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        start: formatDate(threeMonthsAgo),
        end: formatDate(now),
      };
  }
};

export const useSalesData = (period: PeriodOption, vendedor?: string) => {
  const [data, setData] = useState<ProcessedSalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        const { start, end } = getDateRange(period);

        const queryParams = new URLSearchParams({
          start,
          end,
        });

        if (vendedor) {
          queryParams.append("vendedor", vendedor);
        }

        const response = await fetch(`/api/invoices/search?${queryParams}`);
        if (!response.ok) throw new Error("Failed to fetch sales data");

        const salesData: SearchComprobanteResponse = await response.json();
        const processedData = processSalesData(salesData.Items);
        setData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, [period, vendedor]);

  const processSalesData = (items: Comprobante[]): ProcessedSalesData => {
    const salesByDate = items.reduce<Record<string, number>>((acc, item) => {
      try {
        const date = getLocalDateFromISO(item.FechaAlta);
        const amount = parseArgAmount(item.ImporteTotalBruto);

        if (!acc[date]) {
          acc[date] = 0;
        }

        // Simply add the amount - if it's negative, it will be subtracted automatically
        acc[date] += amount;

        console.debug(
          `Processing sale: Date=${date}, Type=${item.TipoFc}, Amount=${amount}, Total=${acc[date]}`
        );
      } catch (error) {
        console.error(`Error processing sale item ${item.Id}:`, error);
      }
      return acc;
    }, {});

    const dailyData = Object.entries(salesByDate)
      .map(([date, sales]) => {
        const [year, month, day] = date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        return {
          date: formattedDate,
          originalDate: date,
          sales,
        };
      })
      .sort((a, b) => a.originalDate.localeCompare(b.originalDate));

    const recentSales = items.slice(0, 5).map((item) => ({
      id: item.Id,
      date: getLocalDateFromISO(item.FechaAlta),
      amount: parseArgAmount(item.ImporteTotalBruto),
      customer: item.RazonSocial,
    }));

    const totalSales = Object.values(salesByDate).reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Calculate projection for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isCurrentMonth = dailyData.some(({ originalDate }) => {
      const [year, month] = originalDate.split("-").map(Number);
      return year === currentYear && month - 1 === currentMonth;
    });

    let projectedSales;
    if (isCurrentMonth && dailyData.length > 0) {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDay = now.getDate();
      const daysRemaining = daysInMonth - currentDay;
      const dailyAverage = totalSales / currentDay;
      projectedSales = totalSales + dailyAverage * daysRemaining;
    }

    return {
      dailyData: dailyData.map(({ originalDate, ...rest }) => rest),
      recentSales,
      totalSales,
      projectedSales,
    };
  };

  return { data, isLoading, error };
};
