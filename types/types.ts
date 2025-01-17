// types/types.ts

// Customer Interface
export interface Customer {
  name: string;
  address: string;
  phone?: string;
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
  delivery_cost: number | null; // legacy
  delivery_date: string | null; // legacy
  type: string;
  supplier_id: string | null;
  suppliers: Supplier | null;
  origin_store: Store | null; 
  dest_store: Store | null; 
  carrier_id: number | null; // legacy
  products: Product[] | null; // legacy
  delivery_items?: DeliveryItem[];
  operations?: DeliveryOperation[];
}

export interface Supplier {
  id: number;
  name: string;
}

export type Store = "cd" | "9dejulio" | "carcano";
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

export interface DeliveryOperation {
  id: number;
  delivery_id: number;
  carrier_id: number | null;
  cost: number;
  operation_date: string;
  created_at: string;
  created_by: string | null;
  operation_items?: OperationItem[];
}

export interface OperationItem {
  operation_id: number;
  product_sku: string;
  quantity: number;
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
  type: 'local' | 'national';
  is_reliable: boolean;
  avg_cost?: number;
}

export type OperationResult<T> = Promise<Result<T>>;

// Helper type for operation creation
export interface CreateOperationInput {
  delivery_id: number;
  carrier_id?: number;
  cost: number;
  operation_date: string;
  items: {
    product_sku: string;
    quantity: number;
  }[];
}
