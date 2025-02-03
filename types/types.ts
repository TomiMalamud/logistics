// types/types.ts

// Customer Interface
export interface Customer {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  dni?: string;
}

// Note Interface
export interface Note {
  id: number;
  text: string;
  created_at?: string;
}

// User Interface
export interface User {
  id: string;
  email: string | null;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  user_id_erp?: string | null;
}

export type Product = {
  name: string;
  quantity?: number;
  sku?: string;
};

export type DeliveryState = "pending" | "delivered" | "cancelled";
export type DeliveryItemState = "pending" | "delivered";

// Delivery Interface
export interface Delivery {
  id: number;
  order_date: string;
  customer_id: number;
  state: DeliveryState;
  scheduled_date: string | null;
  created_at: string;
  created_by: Profile | null;
  customers: Customer | null;
  notes?: Note[] | null;
  invoice_number: string | null;
  invoice_id: number | null;
  type: string;
  supplier_id: string | null;
  suppliers: Supplier | null;
  origin_store: string | null;
  dest_store: string | null;
  products: Product[] | null; // legacy
  delivery_items?: DeliveryItem[];
  operations?: DeliveryOperation[];
  store_id?: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export interface Store {
  id: string; // inventory ID from ERP
  label: string; // display name
}

export type DeliveredType = "carrier" | "pickup";
export type DeliveryType =
  | "home_delivery"
  | "supplier_pickup"
  | "store_movement"
  | "all";

// Props for Delivery Component
export interface DeliveryProps {
  delivery: Delivery;
  fetchURL?: string;
}

// Parameters for useDeliveryLogic Hook
export interface UseDeliveryLogicParams {
  delivery: Delivery;
  fetchURL?: string;
}

export interface InvoiceItem {
  Codigo: string;
  Cantidad: number;
  Concepto: string;
}

export interface InvoiceData {
  Items: InvoiceItem[];
}

export interface CacheEntry {
  balance: string;
  timestamp: number;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface PerfitContact {
  email: string;
  firstName: string;
  lastName: string;
}

export interface PerfitResponse {
  data: {
    id: number;
    email: string;
    [key: string]: any;
  };
}

export type Role = "admin" | "sales";
export type OperationType = "delivery" | "cancellation";

export interface DeliveryOperation {
  id: number;
  delivery_id: number;
  carriers?: {
    id: number;
    name: string;
  };
  cost: number;
  operation_date: string;
  created_at: string;
  created_by: string;
  profiles?: {
    id: string;
    name: string;
  } | null;
  pickup_store: string | null;
  operation_type: OperationType;
  operation_items?: OperationItemWithProduct[];
}
export interface OperationItemWithProduct extends OperationItem {
  products?: {
    name: string;
  };
}

export interface OperationItem {
  operation_id: number;
  product_sku: string;
  quantity: number;
  store_id?: string;
}

export interface DeliveryItem {
  delivery_id: number;
  product_sku: string;
  quantity: number;
  pending_quantity: number;
  products?: {
    name: string;
  };
}

export interface Carrier {
  id: number;
  name: string;
  phone: string;
  service_area?: string;
  location?: string;
  service_hours?: string;
  notes?: string;
  last_delivery: string;
  type: "local" | "national";
  is_reliable: boolean;
  avg_cost?: number;
}
