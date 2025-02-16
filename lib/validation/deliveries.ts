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
    order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    products: z.array(productSchema).min(1, "At least one product is required"),
    invoice_number: z.string().optional(),
    invoice_id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    phone: z.string().min(1, "Phone is required"),
    dni: z.string().min(1, "DNI is required"),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
    notes: z.string().optional(),
    created_by: z.string().min(1, "Created by is required"),
    email: z.string().email("Invalid email").nullable(),
    emailBypassReason: z.string().optional(),
    store_id: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "Invalid store ID" }),
    }),
  })
  .refine(
    (data) => data.email || data.emailBypassReason,
    "Either email or email bypass reason must be provided"
  );

// Pickup delivery schema
export const pickupDeliverySchema = z.object({
  products: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU is required"),
        quantity: z.number().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one product is required"),
  supplier_id: z.number().positive("Supplier ID is required"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  created_by: z.string().min(1, "Created by is required"),
});

// Store movement schema
export const storeMovementSchema = z
  .object({
    origin_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "Invalid origin store" }),
    }),
    dest_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      errorMap: () => ({ message: "Invalid destination store" }),
    }),
    products: z.array(productSchema).min(1, "At least one product is required"),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
    created_by: z.string().min(1, "Created by is required"),
  })
  .refine(
    (data) => data.origin_store !== data.dest_store,
    "Origin and destination stores must be different"
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
        required_error: "Invalid start date format",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/,
        "Invalid start date format"
      ),
    endDate: z
      .string({
        required_error: "Invalid end date format",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/,
        "Invalid end date format"
      ),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["startDate"],
    }
  );

export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
