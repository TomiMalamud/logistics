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
import {
  Document,
  Font,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInBusinessDays, format } from "date-fns";
import {
  Check,
  CheckCircle,
  ChevronDown,
  FileDown,
  Filter,
  Loader2,
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
  finished: {
    color: "bg-green-100 text-green-800",
    label: "Terminada",
  },
  cancelled: {
    color: "bg-red-100 text-red-800",
    label: "Cancelada",
  },
};

// Register a font for PDF generation
Font.register({
  family: "Helvetica",
  src: "https://fonts.cdnfonts.com/s/29136/Helvetica.woff",
});

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  section: {
    width: "100%",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    backgroundColor: "#f6f6f6",
    fontSize: 12,
    fontWeight: "bold",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    fontSize: 11,
  },
  delayedText: {
    textDecoration: "underline",
  },
});

interface OrdersPDFProps {
  orders: Array<{
    id: number;
    orderDate: Date;
    status: ManufacturingStatus;
    finishedAt: Date | null;
    customerName: string | null;
    productName: string;
    extras: string | null;
    notes: string | null;
    needsPackaging: boolean;
  }>;
}

// PDF Document component
const OrdersPDF = ({ orders }: OrdersPDFProps) => {
  // Helper function for business days calculation within the component
  const calculateBusinessDays = (
    orderDate: Date,
    status: ManufacturingStatus,
    finishedAt: Date | null
  ) => {
    const normalizeDate = (date: Date) => {
      const normalized = new Date(
        date.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      const day = normalized.getUTCDay();
      if (day === 6) {
        normalized.setUTCDate(normalized.getUTCDate() - 1);
      } else if (day === 0) {
        normalized.setUTCDate(normalized.getUTCDate() - 2);
      }
      return normalized;
    };

    if (status === "pending") {
      const today = normalizeDate(new Date());
      const start = normalizeDate(orderDate);
      return differenceInBusinessDays(today, start);
    }
    return differenceInBusinessDays(
      normalizeDate(finishedAt || new Date()),
      normalizeDate(orderDate)
    );
  };

  const splitProductName = (productName: string) => {
    const words = productName.split(" ");
    const measure = words[0];
    const color = words.slice(1).join(" ");
    return { measure, color };
  };

  const targetDays = 15;

  // Add truncateCustomerName function
  const truncateCustomerName = (name: string | null) => {
    if (!name) return "Sin cliente";
    const words = name.trim().split(" ");
    if (words.length <= 2) return name;
    return `${words.slice(0, 2).join(" ")}...`;
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: "10%" }]}>
                <Text>Días</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "10%" }]}>
                <Text>Fecha</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "16%" }]}>
                <Text>Cliente</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "10%" }]}>
                <Text>Medida</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "14%" }]}>
                <Text>Color</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "16%" }]}>
                <Text>Extra</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "16%" }]}>
                <Text>Notas</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "8%" }]}>
                <Text>Emb.</Text>
              </View>
            </View>
            {orders.map((order) => {
              const days = calculateBusinessDays(
                order.orderDate,
                order.status,
                order.finishedAt
              );
              const isDelayed = days > targetDays && order.status === "pending";
              const { measure, color } = splitProductName(order.productName);

              return (
                <View key={order.id} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: "10%" }]}>
                    <View>
                      <Text>{days}</Text>
                      {isDelayed && (
                        <Text style={styles.delayedText}>ATRASADA</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.tableCol, { width: "10%" }]}>
                    <Text>
                      {formatDate(
                        order.orderDate.toISOString().split("T")[0]
                      ).replace("/2025", "")}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "16%" }]}>
                    <Text>{truncateCustomerName(order.customerName)}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "10%" }]}>
                    <Text>{measure}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "14%" }]}>
                    <Text>{color}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "16%" }]}>
                    <Text>{order.extras || "-"}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "16%" }]}>
                    <Text>{order.notes || "-"}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "8%" }]}>
                    <Text>{order.needsPackaging ? "Sí" : "No"}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );
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
          finished_at: status === "finished" ? new Date().toISOString() : null,
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
    finishedAt: Date | null
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
    // For finished/cancelled orders, show days it took to complete
    return differenceInBusinessDays(
      normalizeDate(finishedAt || new Date()),
      normalizeDate(orderDate)
    );
  };

  // Format relative time remaining
  const getTimeStatus = (daysElapsed: number, status: ManufacturingStatus) => {
    const targetDays = 15; // 15 business days target

    if (status === "pending") {
      if (daysElapsed > targetDays) {
        return <span className="text-red-600 font-medium">{daysElapsed}</span>;
      }
      return <span className="text-gray-600">{daysElapsed}</span>;
    }

    // For finished/cancelled orders, show total days it took
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

        {filteredOrders.length > 0 && (
          <PDFDownloadLink
            document={<OrdersPDF orders={filteredOrders} />}
            fileName={`Stilo Propio - ${new Date().toLocaleDateString(
              "es-AR"
            )}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="outline"
                disabled={loading}
                className="bg-red-100 hover:bg-red-200"
              >
                <FileDown size={16} />
                {loading ? "Generando PDF..." : "Exportar PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
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
                    order.finishedAt
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
                {order.finishedAt
                  ? format(new Date(order.finishedAt), "dd/MM")
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
                            status: "finished",
                          });
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como terminada
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
