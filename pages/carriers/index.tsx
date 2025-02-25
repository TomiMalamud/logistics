// pages/carriers/index.tsx

import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, sanitizePhoneNumber } from "@/lib/utils/format";
import { createClient } from "@/lib/utils/supabase/component";
import { Carrier } from "@/types/types";
import { DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";

const carrierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  service_area: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  service_hours: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  type: z.enum(["local", "national"]).nullable().optional(),
  avg_cost: z.number().nullable().optional(),
  is_reliable: z.boolean().default(false),
});

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [error, setError] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [currentCarrier, setCurrentCarrier] = useState<Carrier | null>(null);
  const supabase = createClient();

  const fetchCarriers = useCallback(async () => {
    const { data, error } = await supabase
      .from("carriers")
      .select(
        `
        *,
        delivery_operations (
          operation_date,
          operation_type,
          delivery_id,
          deliveries (
            state
          )
        )
      `
      )
      .order("name");

    if (error) {
      setError("Failed to fetch carriers");
      return;
    }

    // Process the data to get the last delivery date
    const processedData = data.map((carrier) => ({
      ...carrier,
      last_delivery:
        carrier.delivery_operations
          ?.filter(
            (op) =>
              op.operation_type === "delivery" &&
              op.deliveries?.state === "delivered"
          )
          .sort(
            (a, b) =>
              new Date(b.operation_date).getTime() -
              new Date(a.operation_date).getTime()
          )[0]?.operation_date || null,
      delivery_operations: undefined,
    }));

    setCarriers(processedData);
  }, [supabase]);

  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  useEffect(() => {
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const sanitizedPhone = formData.get("phone") as string;

    const rawData = {
      name: formData.get("name") as string,
      phone: sanitizedPhone,
      service_area: (formData.get("service_area") as string) || null,
      location: (formData.get("location") as string) || null,
      service_hours: (formData.get("service_hours") as string) || null,
      notes: (formData.get("notes") as string) || null,
      type: (formData.get("type") as "local" | "national") || null,
      avg_cost: Number(formData.get("avg_cost")) || null,
      is_reliable: formData.get("is_reliable") === "true",
    };

    // Validate with Zod
    const result = carrierSchema.safeParse(rawData);

    if (!result.success) {
      // Handle validation errors
      const formattedErrors = result.error.format();
      console.error("Validation errors:", formattedErrors);
      setError("Por favor, verifica los datos ingresados.");
      return;
    }

    const carrierData = result.data;

    if (currentCarrier) {
      const { error } = await supabase
        .from("carriers")
        .update(carrierData)
        .eq("id", currentCarrier.id);

      if (error) {
        setError("Error al actualizar el transporte.");
        return;
      }
    } else {
      // Create a properly typed carrier object for insertion
      const carrierToInsert = {
        name: carrierData.name,
        phone: carrierData.phone,
        service_area: carrierData.service_area,
        location: carrierData.location,
        service_hours: carrierData.service_hours,
        notes: carrierData.notes,
        type: carrierData.type,
        avg_cost: carrierData.avg_cost,
        is_reliable: carrierData.is_reliable,
      };

      const { error: insertError } = await supabase
        .from("carriers")
        .insert([carrierToInsert]);

      if (insertError) {
        setError("Error al crear el transporte.");
        return;
      }
    }

    setIsOpen(false);
    setCurrentCarrier(null);
    fetchCarriers();
    event.currentTarget.reset();
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Estás seguro que querés eliminar este transporte?")) return;

    const { error } = await supabase.from("carriers").delete().eq("id", id);

    if (error) {
      setError("Failed to delete carrier");
      return;
    }

    fetchCarriers();
  }

  function handleEdit(carrier: Carrier) {
    setCurrentCarrier(carrier);
    setIsOpen(true);
  }

  const getTypeBadgeVariant = (type: string) => {
    return type === "local" ? "outline" : "secondary";
  };

  return (
    <Layout title="Transportes">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transportes</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCurrentCarrier(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Transporte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentCarrier ? "Editar Transporte" : "Agregar un Transporte"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={currentCarrier?.name}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    defaultValue={currentCarrier?.phone}
                    onChange={(e) => {
                      const sanitized = sanitizePhoneNumber(e.target.value);
                      e.target.value = sanitized;
                    }}
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    name="type"
                    defaultValue={currentCarrier?.type || "local"}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="national">Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="service_area">Área de Servicio</Label>
                  <Input
                    id="service_area"
                    name="service_area"
                    defaultValue={currentCarrier?.service_area}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Domicilio de Despacho</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={currentCarrier?.location}
                  />
                </div>
                <div>
                  <Label htmlFor="service_hours">Horario de Despacho</Label>
                  <Input
                    id="service_hours"
                    name="service_hours"
                    defaultValue={currentCarrier?.service_hours}
                  />
                </div>
                <div>
                  <Label htmlFor="avg_cost">Costo Promedio</Label>
                  <Input
                    id="avg_cost"
                    name="avg_cost"
                    type="number"
                    defaultValue={currentCarrier?.avg_cost}
                  />
                </div>
                <div>
                  <Label htmlFor="is_reliable">Confiabilidad</Label>
                  <Select
                    name="is_reliable"
                    defaultValue={
                      currentCarrier?.is_reliable ? "true" : "false"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reliability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Confiable</SelectItem>
                      <SelectItem value="false">No Confiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={currentCarrier?.notes}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {currentCarrier ? "Actualizar" : "Crear"}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {carriers.map((carrier) => (
          <Card key={carrier.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{carrier.name}</h3>
                <a className="text-gray-500" href={`tel:${carrier.phone}`}>
                  {carrier.phone}
                </a>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/carriers/${carrier.id}/balance`}>
                    <DollarSign className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(carrier)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(carrier.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {carrier.service_area && (
                <p className="text-sm text-gray-600">
                  Área de Servicio:{" "}
                  <span className="font-semibold">{carrier.service_area}</span>
                </p>
              )}
              {carrier.location && (
                <p className="text-sm text-gray-600">
                  Domicilio de Despacho:{" "}
                  <span className="font-semibold">{carrier.location}</span>
                </p>
              )}
              {carrier.service_hours && (
                <p className="text-sm text-gray-600">
                  Horario de despacho:{" "}
                  <span className="font-semibold">{carrier.service_hours}</span>
                </p>
              )}
              {carrier.avg_cost > 0 && (
                <p className="text-sm text-gray-600">
                  Costo promedio:{" "}
                  <span className="font-semibold">
                    $ {carrier.avg_cost.toLocaleString("es-AR")}
                  </span>
                </p>
              )}
              {carrier.last_delivery && (
                <p className="text-sm text-gray-600">
                  Último envío:{" "}
                  <span className="font-semibold">
                    {formatDate(carrier.last_delivery)}
                  </span>
                </p>
              )}
              {carrier.notes && (
                <p className="text-sm text-gray-600">
                  Notas: <span className="font-semibold">{carrier.notes}</span>
                </p>
              )}
              <div className="pt-2 flex items-center gap-x-2">
                <Badge
                  variant="default"
                  className={`${
                    carrier.is_reliable ? "bg-green-600/90" : "bg-red-400"
                  }`}
                >
                  {carrier.is_reliable ? "Confiable" : "No Confiable"}
                </Badge>
                <Badge
                  variant={getTypeBadgeVariant(carrier.type || "local")}
                  className="pointer-events-none"
                >
                  {carrier.type === "local" ? "Local" : "Nacional"}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
