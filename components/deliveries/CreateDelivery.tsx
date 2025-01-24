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
import type { Comprobante } from "@/types/api";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, Edit2, Mail, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import { titleCase } from "title-case";
import { Skeleton } from "../ui/skeleton";

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

export default function DeliveryForm({ user }: DeliveryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [selectedInvoice, setSelectedInvoice] =
    React.useState<Comprobante | null>(null);
  const [invoiceItems, setInvoiceItems] = React.useState([]);
  const [storeId, setStoreId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    address: "",
    phone: "",
    dni: "",
    email: null as string | null,
    emailBypassReason: "",
    scheduled_date: "",
    notes: "",
  });

  // UI state
  const [invoices, setInvoices] = React.useState<Comprobante[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [validationErrors, setValidationErrors] = React.useState({
    phone: "",
    address: "",
    email: "",
  });
  const [loadingDetails, setLoadingDetails] = React.useState(false);

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
        fetch(`/api/customer/${selectedInv.IdCliente}`),
        fetch(`/api/invoices/${invoiceId}`),
      ]);

      if (!customerRes.ok || !itemsRes.ok) {
        throw new Error("Failed to fetch invoice details");
      }

      const [customer, itemsData] = await Promise.all([
        customerRes.json(),
        itemsRes.json(),
      ]);

      // Update form with customer data
      const sanitizedPhone = sanitizePhoneNumber(customer.Telefono || "");
      setFormData((prev) => ({
        ...prev,
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
      }));

      setInvoiceItems(itemsData.items || []);
      setStoreId(itemsData.inventoryId);
      validatePhone(sanitizedPhone);
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
      setValidationErrors((prev) => ({
        ...prev,
        phone: "El teléfono es requerido",
      }));
      return false;
    }
    if (!validatePhoneNumber(phone)) {
      setValidationErrors((prev) => ({
        ...prev,
        phone: "Sin 0 ni 15, sin espacios ni guiones",
      }));
      return false;
    }
    setValidationErrors((prev) => ({ ...prev, phone: "" }));
    return true;
  };

  const validateForm = () => {
    const errors = {
      address: !formData.address.trim() ? "La dirección es requerida" : "",
      phone: "",
      email:
        !formData.email && !formData.emailBypassReason
          ? "El email es requerido o se debe indicar por qué no lo tenemos"
          : "",
    };

    const phoneValid = validatePhone(formData.phone);
    errors.phone = validationErrors.phone;

    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean) && phoneValid;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !validateForm() || !storeId) {
      if (!storeId) {
        setError("No se pudo determinar el depósito de origen");
      }
      return;
    }
    setLoading(true);
    try {
      const transformedItems = invoiceItems.map((item) => ({
        name: item.Concepto,
        sku: item.Codigo,
        quantity: item.Cantidad,
      }));

      const body = {
        ...formData,
        phone: sanitizePhoneNumber(formData.phone),
        order_date: new Date(selectedInvoice.FechaAlta)
          .toISOString()
          .split("T")[0],
        invoice_number: `${selectedInvoice.TipoFc} ${selectedInvoice.Numero}`,
        invoice_id: selectedInvoice.Id,
        name: selectedInvoice.RazonSocial,
        created_by: user.id,
        products: transformedItems,
        store_id: storeId,
        dni: formData.dni,
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

      router.push("/");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
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

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label>Factura</Label>
            <Select onValueChange={handleInvoiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un comprobante" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {isLoading ? (
                    <SelectItem value="loading">Cargando...</SelectItem>
                  ) : (
                    invoices.map((inv) => (
                      <SelectItem key={inv.Id} value={String(inv.Id)}>
                        {inv.TipoFc} {inv.Numero} | {inv.RazonSocial}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedInvoice && (
            <>
              {/* Customer Info Card */}
              {loadingDetails ? (
                <CustomerInfoSkeleton />
              ) : (
                <CustomerInfoCard
                  formData={formData}
                  setFormData={setFormData}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
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
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_date: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Notas</Label>
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
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
          <Alert variant="destructive" className="mt-4 mx-6 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </Card>
  );
}

// Customer Info Card Component
function CustomerInfoCard({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
}) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = React.useState(false);
  const [bypassReason, setBypassReason] = React.useState("");
  const [editedAddress, setEditedAddress] = React.useState(formData.address);

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
                {formData.address
                  ? titleCase(formData.address.toLowerCase())
                  : "Dirección requerida"}
              </span>
            </div>
            <AddressEditDialog
              address={editedAddress}
              setAddress={setEditedAddress}
              isOpen={isAddressDialogOpen}
              setIsOpen={setIsAddressDialogOpen}
              onSave={(address) => {
                setFormData((prev) => ({ ...prev, address }));
                setValidationErrors((prev) => ({ ...prev, address: "" }));
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
              {formData.phone || "Teléfono requerido"}
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
                {formData.email ||
                  formData.emailBypassReason ||
                  "Email requerido"}
              </span>
            </div>
            {!formData.email && !formData.emailBypassReason && (
              <EmailBypassDialog
                isOpen={isEmailDialogOpen}
                setIsOpen={setIsEmailDialogOpen}
                reason={bypassReason}
                setReason={setBypassReason}
                onSave={(reason) => {
                  setFormData((prev) => ({
                    ...prev,
                    emailBypassReason: reason,
                  }));
                  setValidationErrors((prev) => ({ ...prev, email: "" }));
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
              {Object.values(validationErrors).filter(Boolean).join(". ")}
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
