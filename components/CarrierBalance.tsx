import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { BalanceResponse } from "@/pages/api/carriers/[id]/balance";
import { formatDate } from "@/utils/format";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import PaymentForm from "./PaymentForm";

interface CarrierBalanceProps {
  carrierId: string;
}

interface DeliveryUpdateData {
  delivery_cost: number;
  carrier_id: number;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("es-AR");
};

const CarrierBalance: React.FC<CarrierBalanceProps> = ({ carrierId }) => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    data: BalanceResponse | null;
    isUpdating: boolean;
  }>({
    isLoading: true,
    error: null,
    data: null,
    isUpdating: false
  });

  const fetchData = useCallback(async () => {
    if (!carrierId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/carriers/${carrierId}/balance`);
      if (!response.ok) {
        throw new Error("Failed to fetch carrier balance");
      }

      const balanceData = await response.json();
      setState((prev) => ({ ...prev, data: balanceData }));
    } catch (err) {
      console.error("Error fetching data:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred"
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [carrierId]);

  const handleUpdateDeliveryDetails = useCallback(
    async (deliveryId: string, data: DeliveryUpdateData) => {
      try {
        setState((prev) => ({ ...prev, isUpdating: true }));

        const response = await fetch(`/api/deliveries/${deliveryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error("Failed to update delivery details");
        }

        await fetchData();
      } catch (error) {
        console.error("Error updating delivery details:", error);
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="text-center text-red-600">
        {state.error || "No se pudo cargar la información"}
      </div>
    );
  }

  const { carrier, transactions, totalBalance } = state.data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Estado de Cuenta - {carrier.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Mostrando últimos 30 días
          </p>
        </div>
        <PaymentForm
          carrierId={carrierId}
          onSuccess={fetchData}
          trigger={<Button className="ml-4">Nuevo Pago</Button>}
        />
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => {
              return (
                <TableRow key={`${transaction.date}-${index}`}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/?search=${transaction.concept
                        .split("-")
                        .pop()
                        ?.trim()}&state=delivered`}
                      className="underline-offset-4 hover:underline transition duration-200 underline decoration-white hover:decoration-slate-800"
                      target="_blank"
                    >
                      {transaction.concept}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.debit > 0 && formatCurrency(transaction.debit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.credit > 0 &&
                      formatCurrency(transaction.credit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-end">
          <div
            className={`text-lg font-semibold ${
              totalBalance > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Saldo Total: $ {formatCurrency(totalBalance)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarrierBalance;
