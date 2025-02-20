import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BalanceResponse } from "@/pages/api/carriers/[id]/balance";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import PaymentForm from "./PaymentForm";
import Delivery from "./deliveries/Delivery";

interface CarrierBalanceProps {
  carrierId: string;
}

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
    isUpdating: false,
  });

  const [deliveryDialog, setDeliveryDialog] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    data: any | null;
  }>({
    isOpen: false,
    isLoading: false,
    error: null,
    data: null,
  });

  const fetchData = useCallback(async () => {
    if (!carrierId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch(`/api/carriers/${carrierId}/balance`);
      if (!response.ok) throw new Error("Failed to fetch carrier balance");
      const balanceData = await response.json();
      setState((prev) => ({ ...prev, data: balanceData }));
    } catch (err) {
      console.error("Error fetching data:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [carrierId]);

  const fetchDelivery = useCallback(async (deliveryId: number) => {
    setDeliveryDialog((prev) => ({
      ...prev,
      isOpen: true,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`);
      if (!response.ok) throw new Error("Failed to fetch delivery");
      const data = await response.json();
      if (!data) throw new Error("No delivery data received");
      setDeliveryDialog((prev) => ({ ...prev, data }));
    } catch (err) {
      console.error("Error fetching delivery:", err);
      setDeliveryDialog((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred",
      }));
    } finally {
      setDeliveryDialog((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setDeliveryDialog((prev) => ({
        ...prev,
        isOpen: false,
        data: null,
        error: null,
      }));
    }
  };

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
    <>
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
          <div className="mb-4 p-3 bg-muted rounded-md">
            <span className="font-medium">Saldo anterior: </span>
            <span
              className={
                state.data.initialBalance > 0
                  ? "text-red-600"
                  : "text-green-600"
              }
            >
              {formatCurrency(state.data.initialBalance)}
            </span>
          </div>
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
              {transactions.map((transaction, index) => (
                <TableRow key={`${transaction.date}-${index}`}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    {transaction.type === "delivery" ? (
                      <button
                        onClick={() =>
                          transaction.delivery_id &&
                          fetchDelivery(transaction.delivery_id)
                        }
                        className="underline-offset-4 hover:underline transition duration-200 underline decoration-white hover:decoration-slate-800"
                      >
                        {transaction.concept}
                      </button>
                    ) : (
                      transaction.concept
                    )}
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
              ))}
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

      <Dialog open={deliveryDialog.isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl p-8">
          <DialogHeader>
            <DialogTitle>Detalle de Entrega</DialogTitle>
            <DialogDescription>
              Si la entrega se hizo en partes, recordá revisar el historial de
              entrega.
            </DialogDescription>
          </DialogHeader>
          {deliveryDialog.isLoading && (
            <div className="space-y-8 min-h-80 rounded-lg bg-white border p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {deliveryDialog.error && (
            <div className="text-red-500 text-center py-4">
              Error loading delivery: {deliveryDialog.error}
            </div>
          )}
          {!deliveryDialog.isLoading &&
            !deliveryDialog.error &&
            deliveryDialog.data && <Delivery delivery={deliveryDialog.data} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CarrierBalance;
