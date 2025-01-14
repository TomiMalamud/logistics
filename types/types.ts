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
    quantity: number;
    sku?: string;
  };

  // Delivery Interface
  export interface Delivery {
    id: number;
    order_date: string;
    customer_id: number;
    state: string;
    scheduled_date: string | null;
    created_at: string;
    created_by: Profile | null;
    customers: Customer | null;
    notes?: Note[] | null;
    invoice_number: string | null,
    invoice_id: number | null,
    delivery_cost: number | null,
    delivery_date: string | null,
    type: string,
    supplier_id: string | null,
    suppliers: Supplier | null,
    origin_store: Store | null,
    dest_store: Store | null,
    carrier_id: number | null,
    products: Product[] | null,
  }

  export interface Supplier {
    id: number;
    name: string;
  }
  
  export type Store = 'cd' | '9dejulio' | 'carcano'

  export type DeliveryType = "carrier" | "pickup"

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