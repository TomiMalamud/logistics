import { ProductItem } from "@/components/ProductList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStore } from "@/lib/utils/constants";
import { sanitizePhoneNumber, validatePhoneNumber } from "@/lib/utils/format";
import { Database } from "@/supabase/types/supabase";
import type { Comprobante } from "@/types/api";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
import { titleCase } from "title-case";
import * as z from "zod";
import { Skeleton } from "../ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Store = Database["public"]["Enums"]["store"];
type DeliveryType = Database["public"]["Enums"]["delivery_type"];

interface DeliveryFormProps {
  user: User;
}
function CustomerInfoSkeleton() {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeliveryFormValues {
  invoice_id: string;
  address: string;
  phone: string;
  email: string | null;
  emailBypassReason?: string;
  scheduled_date?: string;
  notes?: string;
  dni: string | null;
  products: ProductItem[];
  store_id: Store;
  type: DeliveryType;
}

const deliveryFormSchema = z
  .object({
    invoice_id: z.string({
      required_error: "Seleccioná una factura",
    }),
    address: z.string().min(1, "La dirección es requerida"),
    phone: z.string().refine((val) => validatePhoneNumber(val), {
      message: "Sin 0 ni 15, sin espacios ni guiones",
    }),
    email: z.string().email("Email inválido").nullable(),
    emailBypassReason: z.string().optional(),
    scheduled_date: z.string().optional(),
    notes: z.string().optional(),
    dni: z.string().nullable(),
    products: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          sku: z.string().min(1),
          quantity: z.number().min(1),
        }),
      )
      .optional(),
    store_id: z.enum(["60835", "24471", "31312", "70749"] as const),
    type: z.enum([
      "supplier_pickup",
      "home_delivery",
      "store_movement",
    ] as const),
  })
  .refine(
    (data) => {
      if (!data.email && !data.emailBypassReason) {
        return false;
      }
      return true;
    },
    {
      message: "El email es requerido o se debe indicar por qué no lo tenemos",
      path: ["email"],
    },
  );

export default function DeliveryForm({ user }: DeliveryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [selectedInvoice, setSelectedInvoice] =
    React.useState<Comprobante | null>(null);
  const [invoiceItems, setInvoiceItems] = React.useState([]);
  const [storeId, setStoreId] = React.useState<string | null>(null);
  const [invoices, setInvoices] = React.useState<Comprobante[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [openCombobox, setOpenCombobox] = React.useState(false);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      address: "",
      phone: "",
      email: null,
      emailBypassReason: "",
      scheduled_date: "",
      notes: "",
      dni: null,
      products: [],
      store_id: "60835",
      type: "home_delivery",
    },
  });

  // Load invoices on mount
  React.useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices/search");
        if (!response.ok) throw new Error("Failed to fetch invoices");
        const data = await response.json();
        setInvoices(data.Items);
      } catch (error) {
        setError("Error loading invoices");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Handle invoice selection and load details
  const handleInvoiceSelect = async (invoiceId: string) => {
    setLoadingDetails(true);
    setError(null);

    try {
      const selectedInv = invoices.find((inv) => inv.Id === Number(invoiceId));
      if (!selectedInv) throw new Error("Invoice not found");
      setSelectedInvoice(selectedInv);

      // Fetch both customer and items data in parallel
      const [customerRes, itemsRes] = await Promise.all([
        fetch(`/api/customer/${selectedInv.IdCliente}?razonSocial=${encodeURIComponent(selectedInv.RazonSocial)}`),
        fetch(`/api/invoices/${invoiceId}`),
      ]);

      if (!customerRes.ok || !itemsRes.ok) {
        throw new Error("Failed to fetch invoice details");
      }

      const [customer, itemsData] = await Promise.all([
        customerRes.json(),
        itemsRes.json(),
      ]);

      // Update form with customer data and invoice ID
      const sanitizedPhone = sanitizePhoneNumber(customer.Telefono || "");
      form.reset({
        ...form.getValues(), // Preserve existing values including defaults
        invoice_id: String(selectedInv.Id),
        address: [
          customer.Domicilio,
          customer.Ciudad,
          customer.Provincia,
          customer.Cp,
        ]
          .filter(Boolean)
          .join(", "),
        phone: sanitizedPhone,
        email: customer.Email || null,
        dni: customer.NroDoc || null,
      });

      setInvoiceItems(itemsData.items || []);
      setStoreId(itemsData.inventoryId);
      validatePhone(sanitizedPhone);

      // Check for Cama con Cajones
      if (
        itemsData.items?.some((item) =>
          item.Concepto?.toLowerCase().includes("cama con cajones"),
        )
      ) {
        setError(
          "Este pedido contiene una Cama con Cajones. Después de guardar la entrega, vas a ir directo a la página de Camas con Cajones.",
        );
      }
    } catch (error) {
      console.error(error);
      setError("Error loading invoice details");
      // Clear previous selection on error
      setSelectedInvoice(null);
      setInvoiceItems([]);
      setStoreId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Validation functions
  const validatePhone = (phone: string) => {
    if (!phone) {
      form.setError("phone", {
        type: "manual",
        message: "El teléfono es requerido",
      });
      return false;
    }
    if (!validatePhoneNumber(phone)) {
      form.setError("phone", {
        type: "manual",
        message: "Sin 0 ni 15, sin espacios ni guiones",
      });
      return false;
    }
    form.clearErrors("phone");
    return true;
  };

  const handleSubmit = async (values: DeliveryFormValues) => {
    if (!selectedInvoice || !storeId) {
      setError("No se pudo determinar el depósito de origen");
      return;
    }

    setLoading(true);
    try {
      const transformedItems = invoiceItems
        .filter((item) => item.Codigo?.trim())
        .map((item) => ({
          name: item.Concepto,
          sku: item.Codigo,
          quantity: item.Cantidad,
        }));

      const body = {
        ...values,
        phone: sanitizePhoneNumber(values.phone),
        order_date: new Date(selectedInvoice.FechaAlta)
          .toISOString()
          .split("T")[0],
        invoice_number: `${selectedInvoice.TipoFc} ${selectedInvoice.Numero}`,
        invoice_id: String(selectedInvoice.Id),
        name: selectedInvoice.RazonSocial,
        created_by: user.id,
        products: transformedItems,
        store_id: storeId,
      };

      const response = await fetch("/api/deliveries/create/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating delivery");
      }

      const { delivery } = await response.json();

      // Check if we need to create a manufacturing order
      const hasBedWithDrawers = invoiceItems.some((item) =>
        item.Concepto?.toLowerCase().includes("cama con cajones"),
      );

      if (hasBedWithDrawers && delivery?.id) {
        router.push(`/manufacturing?delivery_id=${delivery.id}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Nueva entrega</CardTitle>
      </CardHeader>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-6">
          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label>Factura</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {selectedInvoice
                    ? `${selectedInvoice.TipoFc} ${selectedInvoice.Numero} | ${selectedInvoice.RazonSocial}`
                    : isLoading
                      ? "Cargando..."
                      : "Seleccioná un comprobante"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command
                  filter={(value, search) => {
                    const invoice = invoices.find(
                      (inv) => String(inv.Id) === value,
                    );
                    if (!invoice) return 0;
                    const text =
                      `${invoice.TipoFc} ${invoice.Numero} ${invoice.RazonSocial}`.toLowerCase();
                    if (text.includes(search.toLowerCase())) return 1;
                    return 0;
                  }}
                >
                  <CommandInput placeholder="Buscar comprobante..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron comprobantes.</CommandEmpty>
                    <CommandGroup>
                      {invoices.map((inv) => (
                        <CommandItem
                          key={inv.Id}
                          value={String(inv.Id)}
                          onSelect={(currentValue) => {
                            handleInvoiceSelect(currentValue);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedInvoice?.Id === inv.Id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {inv.TipoFc} {inv.Numero} | {inv.RazonSocial}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedInvoice && (
            <>
              {/* Customer Info Card */}
              {loadingDetails ? (
                <CustomerInfoSkeleton />
              ) : (
                <CustomerInfoCard
                  form={form}
                  validationErrors={form.formState.errors}
                />
              )}

              {/* Invoice Items */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Concepto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDetails ? (
                      <TableRow className="h-24"></TableRow>
                    ) : (
                      invoiceItems.map((item) => (
                        <TableRow key={item.Codigo}>
                          <TableCell>{item.Cantidad}</TableCell>
                          <TableCell>{item.Codigo}</TableCell>
                          <TableCell>{item.Concepto}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {!loadingDetails && storeId && (
                <Badge variant="secondary" className="mt-4">
                  Depósito:{" "}
                  <span className="font-bold ml-2">
                    {getStore(storeId)?.label}
                  </span>
                </Badge>
              )}

              {/* Delivery Details */}
              <div className="space-y-4">
                <div>
                  <Label>Fecha de Entrega Programada</Label>
                  <Input
                    type="date"
                    name="scheduled_date"
                    value={form.watch("scheduled_date")}
                    onChange={(e) =>
                      form.setValue("scheduled_date", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Notas</Label>
                  <Input
                    name="notes"
                    value={form.watch("notes")}
                    onChange={(e) => form.setValue("notes", e.target.value)}
                    placeholder="Agregar notas y entre qué calles está"
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !selectedInvoice}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && (
          <Alert
            variant={
              error.includes("Cama con Cajones") ? "default" : "destructive"
            }
            className="mx-auto w-[95%] mb-8"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {error.includes("Cama con Cajones")
                ? "Acción requerida"
                : "Error"}
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </Card>
  );
}

interface CustomerInfoCardProps {
  form: ReturnType<typeof useForm<DeliveryFormValues>>;
  validationErrors: Record<string, { message?: string }>;
}

// Customer Info Card Component
function CustomerInfoCard({ form, validationErrors }: CustomerInfoCardProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = React.useState(false);
  const [bypassReason, setBypassReason] = React.useState("");
  const [editedAddress, setEditedAddress] = React.useState(
    form.watch("address"),
  );

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          {/* Address */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
              <span
                className={`text-gray-700 ${
                  validationErrors.address && "text-red-500"
                }`}
              >
                {form.watch("address")
                  ? titleCase(form.watch("address").toLowerCase())
                  : "Dirección requerida"}
              </span>
            </div>
            <AddressEditDialog
              address={editedAddress}
              setAddress={setEditedAddress}
              isOpen={isAddressDialogOpen}
              setIsOpen={setIsAddressDialogOpen}
              onSave={(address) => {
                form.setValue("address", address);
                form.clearErrors("address");
              }}
            />
          </div>

          {/* Phone */}
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <span
              className={`text-gray-700 ${
                validationErrors.phone && "text-red-500"
              }`}
            >
              {form.watch("phone") || "Teléfono requerido"}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <Mail className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
              <span
                className={`text-gray-700 ${
                  validationErrors.email && "text-red-500"
                }`}
              >
                {form.watch("email") ||
                  form.watch("emailBypassReason") ||
                  "Email requerido"}
              </span>
            </div>
            {!form.watch("email") && !form.watch("emailBypassReason") && (
              <EmailBypassDialog
                isOpen={isEmailDialogOpen}
                setIsOpen={setIsEmailDialogOpen}
                reason={bypassReason}
                setReason={setBypassReason}
                onSave={(reason) => {
                  form.setValue("emailBypassReason", reason);
                  form.clearErrors("email");
                }}
              />
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {Object.values(validationErrors).some(Boolean) && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error en los datos del cliente</AlertTitle>
            <AlertDescription>
              {Object.entries(validationErrors)
                .filter(([, value]) => value?.message)
                .map(([key, error]) => {
                  let fieldName = key;
                  if (key === "address") fieldName = "Domicilio";
                  if (key === "phone") fieldName = "Teléfono";
                  if (key === "email") fieldName = "Email";
                  return `${titleCase(fieldName)}: ${error.message}`;
                })
                .join(". ")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Address Edit Dialog Component
function AddressEditDialog({
  address,
  setAddress,
  isOpen,
  setIsOpen,
  onSave,
}: {
  address: string;
  setAddress: (address: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (address: string) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar domicilio de entrega</DialogTitle>
          <DialogDescription>
            Sólo si el domicilio de facturación es distinto al de entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Domicilio de entrega</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. San Martín 1234 - Córdoba"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onSave(address);
              setIsOpen(false);
            }}
            disabled={!address.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Email Bypass Dialog Component
function EmailBypassDialog({
  isOpen,
  setIsOpen,
  reason,
  setReason,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  reason: string;
  setReason: (reason: string) => void;
  onSave: (reason: string) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Sin email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Por qué no tenemos el email?</DialogTitle>
          <DialogDescription>
            Explicá por qué no podemos obtener el email del cliente
          </DialogDescription>
        </DialogHeader>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Cliente no tiene email / No quiso compartirlo"
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onSave(reason);
              setIsOpen(false);
            }}
            disabled={!reason.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
