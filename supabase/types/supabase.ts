export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      carrier_payments: {
        Row: {
          amount: number;
          carrier_id: number;
          created_at: string;
          id: number;
          notes: string | null;
          payment_date: string;
          payment_method: string;
        };
        Insert: {
          amount: number;
          carrier_id: number;
          created_at?: string;
          id?: never;
          notes?: string | null;
          payment_date: string;
          payment_method: string;
        };
        Update: {
          amount?: number;
          carrier_id?: number;
          created_at?: string;
          id?: never;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carrier_payments_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          }
        ];
      };
      carriers: {
        Row: {
          avg_cost: number | null;
          created_at: string;
          id: number;
          is_reliable: boolean;
          location: string | null;
          name: string;
          notes: string | null;
          phone: string;
          service_area: string | null;
          service_hours: string | null;
          type: Database["public"]["Enums"]["carrier_type"] | null;
        };
        Insert: {
          avg_cost?: number | null;
          created_at?: string;
          id?: number;
          is_reliable?: boolean;
          location?: string | null;
          name: string;
          notes?: string | null;
          phone: string;
          service_area?: string | null;
          service_hours?: string | null;
          type?: Database["public"]["Enums"]["carrier_type"] | null;
        };
        Update: {
          avg_cost?: number | null;
          created_at?: string;
          id?: number;
          is_reliable?: boolean;
          location?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string;
          service_area?: string | null;
          service_hours?: string | null;
          type?: Database["public"]["Enums"]["carrier_type"] | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string;
          dni: string | null;
          email: string | null;
          id: number;
          name: string;
          phone: string | null;
        };
        Insert: {
          address: string;
          dni?: string | null;
          email?: string | null;
          id?: number;
          name: string;
          phone?: string | null;
        };
        Update: {
          address?: string;
          dni?: string | null;
          email?: string | null;
          id?: number;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          created_at: string;
          created_by: string | null;
          customer_id: number | null;
          dest_store: Database["public"]["Enums"]["store"] | null;
          email_bypass_reason: string | null;
          id: number;
          invoice_id: string | null;
          invoice_number: string | null;
          order_date: string;
          origin_store: Database["public"]["Enums"]["store"] | null;
          products: Json | null;
          scheduled_date: string | null;
          state: Database["public"]["Enums"]["delivery_state"];
          store_id: Database["public"]["Enums"]["store"] | null;
          supplier_id: number | null;
          type: Database["public"]["Enums"]["delivery_type"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          customer_id?: number | null;
          dest_store?: Database["public"]["Enums"]["store"] | null;
          email_bypass_reason?: string | null;
          id?: number;
          invoice_id?: string | null;
          invoice_number?: string | null;
          order_date: string;
          origin_store?: Database["public"]["Enums"]["store"] | null;
          products?: Json | null;
          scheduled_date?: string | null;
          state?: Database["public"]["Enums"]["delivery_state"];
          store_id?: Database["public"]["Enums"]["store"] | null;
          supplier_id?: number | null;
          type?: Database["public"]["Enums"]["delivery_type"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          customer_id?: number | null;
          dest_store?: Database["public"]["Enums"]["store"] | null;
          email_bypass_reason?: string | null;
          id?: number;
          invoice_id?: string | null;
          invoice_number?: string | null;
          order_date?: string;
          origin_store?: Database["public"]["Enums"]["store"] | null;
          products?: Json | null;
          scheduled_date?: string | null;
          state?: Database["public"]["Enums"]["delivery_state"];
          store_id?: Database["public"]["Enums"]["store"] | null;
          supplier_id?: number | null;
          type?: Database["public"]["Enums"]["delivery_type"];
        };
        Relationships: [
          {
            foreignKeyName: "deliveries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          }
        ];
      };
      delivery_items: {
        Row: {
          delivery_id: number;
          pending_quantity: number;
          product_sku: string;
          quantity: number;
        };
        Insert: {
          delivery_id: number;
          pending_quantity: number;
          product_sku: string;
          quantity: number;
        };
        Update: {
          delivery_id?: number;
          pending_quantity?: number;
          product_sku?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_items_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_items_product_sku_fkey";
            columns: ["product_sku"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["sku"];
          }
        ];
      };
      delivery_operations: {
        Row: {
          carrier_id: number | null;
          cost: number | null;
          created_at: string;
          created_by: string | null;
          delivery_id: number;
          id: number;
          operation_date: string;
          operation_type: string;
          pickup_store: Database["public"]["Enums"]["store"] | null;
        };
        Insert: {
          carrier_id?: number | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          delivery_id: number;
          id?: number;
          operation_date: string;
          operation_type?: string;
          pickup_store?: Database["public"]["Enums"]["store"] | null;
        };
        Update: {
          carrier_id?: number | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          delivery_id?: number;
          id?: number;
          operation_date?: string;
          operation_type?: string;
          pickup_store?: Database["public"]["Enums"]["store"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_operations_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_operations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_operations_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          }
        ];
      };
      manufacturing_orders: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string;
          delivery_id: number;
          extras: string | null;
          id: number;
          needs_packaging: boolean;
          notes: string | null;
          paid_at: string | null;
          payment_id: number | null;
          price: number | null;
          product_name: string;
          status: Database["public"]["Enums"]["manufacturing_status"];
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          delivery_id: number;
          extras?: string | null;
          id?: number;
          needs_packaging?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          payment_id?: number | null;
          price?: number | null;
          product_name: string;
          status?: Database["public"]["Enums"]["manufacturing_status"];
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          delivery_id?: number;
          extras?: string | null;
          id?: number;
          needs_packaging?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          payment_id?: number | null;
          price?: number | null;
          product_name?: string;
          status?: Database["public"]["Enums"]["manufacturing_status"];
        };
        Relationships: [
          {
            foreignKeyName: "manufacturing_orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manufacturing_orders_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manufacturing_orders_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "manufacturing_payments";
            referencedColumns: ["id"];
          }
        ];
      };
      manufacturing_payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string;
          id: number;
          is_advance_payment: boolean;
          notes: string | null;
          payment_date: string;
          payment_method: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by: string;
          id?: number;
          is_advance_payment?: boolean;
          notes?: string | null;
          payment_date?: string;
          payment_method: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string;
          id?: number;
          is_advance_payment?: boolean;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          created_at: string;
          delivery_id: number;
          id: number;
          text: string;
        };
        Insert: {
          created_at?: string;
          delivery_id: number;
          id?: number;
          text: string;
        };
        Update: {
          created_at?: string;
          delivery_id?: number;
          id?: number;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          }
        ];
      };
      operation_items: {
        Row: {
          operation_id: number;
          product_sku: string;
          quantity: number;
          store_id: Database["public"]["Enums"]["store"] | null;
        };
        Insert: {
          operation_id: number;
          product_sku: string;
          quantity: number;
          store_id?: Database["public"]["Enums"]["store"] | null;
        };
        Update: {
          operation_id?: number;
          product_sku?: string;
          quantity?: number;
          store_id?: Database["public"]["Enums"]["store"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "operation_items_operation_id_fkey";
            columns: ["operation_id"];
            isOneToOne: false;
            referencedRelation: "delivery_operations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operation_items_product_sku_fkey";
            columns: ["product_sku"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["sku"];
          }
        ];
      };
      products: {
        Row: {
          name: string;
          sku: string;
        };
        Insert: {
          name: string;
          sku: string;
        };
        Update: {
          name?: string;
          sku?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          email: string;
          id: string;
          name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          user_id_erp: string | null;
        };
        Insert: {
          email: string;
          id: string;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id_erp?: string | null;
        };
        Update: {
          email?: string;
          id?: string;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id_erp?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_carrier_balance_before_date: {
        Args: {
          p_carrier_id: number;
          p_date: string;
        };
        Returns: number;
      };
      calculate_manufacturer_balance_before_date: {
        Args: {
          p_date: string;
        };
        Returns: number;
      };
      update_pending_quantity: {
        Args: {
          p_delivery_id: number;
          p_product_sku: string;
          p_quantity: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      carrier_type: "local" | "national";
      delivery_state: "pending" | "delivered" | "cancelled";
      delivery_type: "supplier_pickup" | "home_delivery" | "store_movement";
      manufacturing_status:
        | "pending"
        | "paid"
        | "completed"
        | "returned"
        | "cancelled";
      store: "60835" | "24471" | "31312" | "70749";
      user_role: "admin" | "operations" | "sales";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
