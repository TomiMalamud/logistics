import Delivery from "@/components/deliveries/Delivery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders";
import { formatDate } from "@/lib/utils/format";
import { createClient } from "@/lib/utils/supabase/component";
import { ManufacturingStatus } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInBusinessDays, format } from "date-fns";
import {
  Check,
  CheckCircle,
  ChevronDown,
  DollarSign,
  Filter,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Package,
  Pencil,
  X,
} from "lucide-react";
import React, { useState } from "react";

const supabase = createClient();

// Status badge colors and labels
const statusConfig: Record<
  ManufacturingStatus,
  { color: string; label: string }
> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800",
    label: "Pendiente",
  },
  completed: {
    color: "bg-green-100 text-green-800",
    label: "Terminada",
  },
  paid: {
    color: "bg-blue-100 text-blue-800",
    label: "Pagada",
  },
  cancelled: {
    color: "bg-red-100 text-red-800",
    label: "Cancelada",
  },
};

const ManufacturingOrdersList = () => {
  const queryClient = useQueryClient();
  const { data: orders, isLoading, error } = useManufacturingOrders();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    ManufacturingStatus | "all"
  >("pending");
  const [deliveryDialog, setDeliveryDialog] = React.useState<{
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
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean;
    orderId: number | null;
    notes: string;
  }>({
    isOpen: false,
    orderId: null,
    notes: "",
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: ManufacturingStatus;
    }) => {
      const { error } = await supabase
        .from("manufacturing_orders")
        .update({
          status,
          completed_at:
            status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: number;
      notes: string;
    }) => {
      const { error } = await supabase
        .from("manufacturing_orders")
        .update({ notes })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
      setNotesDialog((prev) => ({ ...prev, isOpen: false }));
    },
  });

  // Calculate business days elapsed
  const getBusinessDaysElapsed = (
    orderDate: Date,
    status: ManufacturingStatus,
    completedAt: Date | null
  ) => {
    const normalizeDate = (date: Date) => {
      // Ensure we're working with UTC dates to avoid timezone issues
      const normalized = new Date(
        date.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      // If it's a weekend, move to the last business day
      const day = normalized.getUTCDay();
      if (day === 6) {
        // Saturday
        normalized.setUTCDate(normalized.getUTCDate() - 1);
      } else if (day === 0) {
        // Sunday
        normalized.setUTCDate(normalized.getUTCDate() - 2);
      }
      return normalized;
    };

    if (status === "pending") {
      const today = normalizeDate(new Date());
      const start = normalizeDate(orderDate);
      return differenceInBusinessDays(today, start);
    }
    // For completed/paid/cancelled orders, show days it took to complete
    return differenceInBusinessDays(
      normalizeDate(completedAt || new Date()),
      normalizeDate(orderDate)
    );
  };

  // Test function to debug business days calculation
  const testBusinessDays = () => {
    const testCases = [
      {
        start: "2025-02-04",
        end: "2025-02-15",
        expected: 8,
      },
    ];

    testCases.forEach(({ start, end, expected }) => {
      const startDate = new Date(start + "T00:00:00.000Z");
      const endDate = new Date(end + "T00:00:00.000Z");

      // If end date is a weekend, adjust to last business day
      const endDay = endDate.getUTCDay();
      const adjustedEndDate = new Date(endDate);
      if (endDay === 6) {
        // Saturday
        adjustedEndDate.setUTCDate(adjustedEndDate.getUTCDate() - 1);
      } else if (endDay === 0) {
        // Sunday
        adjustedEndDate.setUTCDate(adjustedEndDate.getUTCDate() - 2);
      }

      const result = differenceInBusinessDays(adjustedEndDate, startDate);

      console.log(`Test case: ${start} to ${end}`);
      console.log(`Expected: ${expected} business days`);
      console.log(`Result: ${result} business days`);
      console.log(
        `Adjusted end date: ${adjustedEndDate.toISOString().split("T")[0]}`
      );

      // Log all business days in between for verification
      const allDates = [];
      let currentDate = new Date(startDate);
      while (currentDate <= adjustedEndDate) {
        if (currentDate.getUTCDay() !== 0 && currentDate.getUTCDay() !== 6) {
          allDates.push(new Date(currentDate).toISOString().split("T")[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log("Business days:", allDates);
      console.log("Total business days found:", allDates.length);
      console.log("-------------------");
    });
  };

  // Run the test
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      testBusinessDays();
    }
  }, []);

  // Format relative time remaining
  const getTimeStatus = (daysElapsed: number, status: ManufacturingStatus) => {
    const targetDays = 15; // 15 business days target

    if (status === "pending") {
      if (daysElapsed > targetDays) {
        return <span className="text-red-600 font-medium">{daysElapsed}</span>;
      }
      return <span className="text-gray-600">{daysElapsed}</span>;
    }

    // For completed/paid/cancelled orders, show total days it took
    return <span className="text-gray-600">{daysElapsed}</span>;
  };

  const fetchDelivery = React.useCallback(async (deliveryId: number) => {
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

  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      const matchesSearch =
        order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        false ||
        order.productName.toLowerCase().includes(search.toLowerCase()) ||
        order.notes?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const sendPendingOrders = () => {
    if (!orders) return;

    const pendingOrders = orders.filter((order) => order.status === "pending");
    const message = `*${pendingOrders.length} PEDIDOS PENDIENTES*
------------------${pendingOrders
      .map((order, index) => {
        const daysElapsed = getBusinessDaysElapsed(
          order.orderDate,
          order.status,
          order.completedAt
        );
        const isLate = daysElapsed > 15;
        return `
${index + 1}. ${order.customerName || "Sin cliente"}
${order.productName}${order.extras ? ` + ${order.extras}` : ""}
Pedido: ${format(order.orderDate, "dd/MM")} (${daysElapsed} dias)${
          isLate ? " *ATRASADA*" : ""
        }${order.needsPackaging ? "\nVa con embalaje" : ""}${
          order.notes ? `\n${order.notes}` : ""
        }`;
      })
      .join("\n------------------\n")}`;

    window.open(
      `https://wa.me/5493541665257?text=${encodeURIComponent(message.trim())}`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error al cargar las órdenes:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Buscar por cliente, producto o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={sendPendingOrders}
          className="gap-2"
          disabled={!orders?.some((order) => order.status === "pending")}
        >
          <MessageSquare className="h-4 w-4" />
          Enviar Pedidos Pendientes
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[140px]">
              {statusFilter === "all"
                ? "Todos los estados"
                : statusConfig[statusFilter].label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              <span className="flex-1">Todos los estados</span>
              {statusFilter === "all" && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setStatusFilter(status as ManufacturingStatus)}
              >
                <Badge className={config.color} variant="secondary">
                  {config.label}
                </Badge>
                {statusFilter === status && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Días</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Terminada</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Extra</TableHead>
            <TableHead>Embalaje</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-bold">
                {getTimeStatus(
                  getBusinessDaysElapsed(
                    order.orderDate,
                    order.status,
                    order.completedAt
                  ),
                  order.status
                )}
              </TableCell>
              <TableCell>
                {formatDate(
                  order.orderDate.toISOString().split("T")[0]
                ).replace("/2025", "")}
              </TableCell>
              <TableCell>
                {order.completedAt
                  ? format(new Date(order.completedAt), "dd/MM")
                  : "-"}
              </TableCell>
              <TableCell>{order.customerName || "Sin cliente"}</TableCell>
              <TableCell>{order.productName}</TableCell>
              <TableCell>
                <Badge
                  className={statusConfig[order.status].color}
                  variant="secondary"
                >
                  {statusConfig[order.status].label}
                </Badge>
              </TableCell>
              <TableCell>{order.extras || "-"}</TableCell>
              <TableCell>{order.needsPackaging ? "Sí" : "No"}</TableCell>

              <TableCell className="max-w-xs truncate">{order.notes}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {order.deliveryId && (
                      <DropdownMenuItem
                        onClick={() => fetchDelivery(order.deliveryId)}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Ver Entrega
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setNotesDialog({
                          isOpen: true,
                          orderId: order.id,
                          notes: order.notes || "",
                        });
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar Notas
                    </DropdownMenuItem>
                    {order.status === "pending" && (
                      <DropdownMenuItem
                        onClick={() => {
                          updateStatus.mutate({
                            orderId: order.id,
                            status: "completed",
                          });
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como terminada
                      </DropdownMenuItem>
                    )}
                    {order.status === "completed" && (
                      <DropdownMenuItem
                        onClick={() => {
                          updateStatus.mutate({
                            orderId: order.id,
                            status: "paid",
                          });
                        }}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Marcar como pagada
                      </DropdownMenuItem>
                    )}
                    {order.status !== "cancelled" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            updateStatus.mutate({
                              orderId: order.id,
                              status: "cancelled",
                            });
                          }}
                          className="text-red-600"
                        >
                          <X size={12} className="mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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

      <Dialog
        open={notesDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) setNotesDialog((prev) => ({ ...prev, isOpen: false }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Notas</DialogTitle>
            <DialogDescription>
              Modificá las notas del pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={notesDialog.notes}
              onChange={(e) =>
                setNotesDialog((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notas del pedido..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() =>
                setNotesDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (notesDialog.orderId) {
                  updateNotes.mutate({
                    orderId: notesDialog.orderId,
                    notes: notesDialog.notes,
                  });
                }
              }}
              disabled={updateNotes.isPending}
            >
              {updateNotes.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManufacturingOrdersList;
