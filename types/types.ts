// types/types.ts

// Customer Interface
export interface Customer {
    nombre: string;
    domicilio: string;
    celular?: string;
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
    punto_venta: string;
    fecha_venta: string;
    producto: string;
    customer_id: number;
    estado: string;
    fecha_programada: string | null;
    created_at: string;
    created_by: Profile | string | null;
    customers: Customer | null;
    notes?: Note[] | null;
    comprobante: string | null,
    id_comprobante: number | null,
    saldo: number | null,
  }
  
  // Props for Entrega Component
  export interface DeliveryProps {
    entrega: Delivery;
    fetchURL?: string;
  }
  
  // Parameters for useEntregaLogic Hook
  export interface UseEntregaLogicParams {
    entrega: Delivery;
    fetchURL?: string;
  }
