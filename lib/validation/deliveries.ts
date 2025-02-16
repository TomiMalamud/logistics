import { z } from "zod";

// Common product schema used across different delivery types
const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().positive("Quantity must be positive"),
  name: z.string().optional(),
});

// Home delivery schema
export const homeDeliverySchema = z
  .object({
    order_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
    products: z.array(productSchema).min(1, "Elegí al menos un producto"),
    invoice_number: z.string().optional(),
    invoice_id: z.string().optional(),
    name: z.string().min(1, "Nombre es requerido"),
    address: z.string().min(1, "Dirección es requerida"),
    phone: z.string().min(1, "Teléfono es requerido"),
    dni: z.string().min(1, "DNI es requerido"),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
      .optional(),
    notes: z.string().optional(),
    created_by: z.string().min(1, "Creado por es requerido"),
    email: z.string().email("Email inválido").nullable(),
    emailBypassReason: z.string().optional(),
    store_id: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "ID de tienda inválido" }),
    }),
  })
  .refine(
    (data) => data.email || data.emailBypassReason,
    "Debe proporcionar un email o una razón de bypass"
  );

// Pickup delivery schema
export const pickupDeliverySchema = z.object({
  products: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU es requerido"),
        quantity: z.number().positive("La cantidad debe ser positiva"),
      })
    )
    .min(1, "Al menos un producto es requerido"),
  supplier_id: z.number().positive("ID de proveedor es requerido"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
    .optional(),
  created_by: z.string().min(1, "Creado por es requerido"),
});

// Store movement schema
export const storeMovementSchema = z
  .object({
    origin_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "Tienda de origen inválida" }),
    }),
    dest_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "Tienda de destino inválida" }),
    }),
    products: z
      .array(productSchema)
      .min(1, "Al menos un producto es requerido"),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
      .optional(),
    created_by: z.string().min(1, "Creado por es requerido"),
  })
  .refine(
    (data) => data.origin_store !== data.dest_store,
    "Las tiendas de origen y destino deben ser diferentes"
  );

// Types inferred from the schemas
export type HomeDeliveryInput = z.infer<typeof homeDeliverySchema>;
export type PickupDeliveryInput = z.infer<typeof pickupDeliverySchema>;
export type StoreMovementInput = z.infer<typeof storeMovementSchema>;

// Calendar query validation schema
export const calendarQuerySchema = z
  .object({
    startDate: z
      .string({
        required_error: "Formato de fecha de inicio inválido",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/,
        "Formato de fecha de inicio inválido"
      ),
    endDate: z
      .string({
        required_error: "Formato de fecha de fin inválido",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/,
        "Formato de fecha de fin inválido"
      ),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "La fecha de inicio debe ser anterior o igual a la fecha de fin",
      path: ["startDate"],
    }
  );

export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
