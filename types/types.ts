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
  }
  

  // Delivery Interface
  export interface Delivery {
    id: number;
    order_date: string;
    products: string;
    customer_id: number;
    state: string;
    scheduled_date: string | null;
    created_at: string;
    created_by: Profile | string | null;
    customers: Customer | null;
    notes?: Note[] | null;
    invoice_number: string | null,
    invoice_id: number | null,
    balance: number | null,
    delivery_cost: number | null,
    delivery_date: string | null,
    type: string,
    supplier_id: string | null,
    suppliers: Supplier | null,
    carrier_id: number | null,
  }

  export interface Supplier {
    id: number;
    name: string;
  }
  
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
