// pages/api/carriers/[id]/balance.ts
import { supabase } from "@/lib/supabase";
import { DeliveryType } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";

export type Transaction = {
  date: string;
  concept: string;
  debit: number;
  credit: number;
  balance: number;
  type: "delivery" | "payment";
  delivery_id?: number;
  delivery_type?: DeliveryType;
};

export type BalanceResponse = {
  carrier: {
    id: number;
    name: string;
  };
  transactions: Transaction[];
  totalBalance: number;
};

type DeliveryWithDetails = {
  id: number;
  delivery_date: string | null;
  invoice_number: string | null;
  delivery_cost: number;
  type: string;
  customers: {
    name: string;
  } | null;
  suppliers: {
    name: string;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid carrier ID" });
  }

  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filterDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Fetch carrier details
    const { data: carrier, error: carrierError } = await supabase
      .from("carriers")
      .select("id, name")
      .eq("id", id)
      .single();

    if (carrierError) throw carrierError;

    // Fetch deliveries with date filter
    const { data: deliveries, error: deliveriesError } = await supabase
      .from("deliveries")
      .select(
        `
        id,
        delivery_date,
        invoice_number,
        delivery_cost,
        type,
        customers (
          name
        ),
        suppliers (
          name
        )
      `
      )
      .eq("carrier_id", id)
      .gte("delivery_date", filterDate)
      .order("delivery_date");

    if (deliveriesError) throw deliveriesError;

    // Fetch payments with date filter
    const { data: payments, error: paymentsError } = await supabase
      .from("carrier_payments")
      .select("*")
      .eq("carrier_id", id)
      .gte("payment_date", filterDate)
      .order("payment_date");

    if (paymentsError) throw paymentsError;

    // Process deliveries to transactions
    const deliveryTransactions = (
      deliveries as unknown as DeliveryWithDetails[]
    )
      .filter((d) => d.delivery_date !== null)
      .map((d) => ({
        date: d.delivery_date as string,
        concept:
          d.type === "store_movement"
            ? "Movimiento de Mercadería"
            : d.type === "supplier_pickup"
            ? `Retiro en ${d.suppliers?.name || "Proveedor sin nombre"}`
            : d.invoice_number
            ? `${d.invoice_number} - ${
                d.customers?.name || "Cliente sin nombre"
              }`
            : "Sin factura",
        debit: d.delivery_cost,
        credit: 0,
        type: "delivery" as const,
        delivery_id: d.id,
        delivery_type: d.type as DeliveryType, 
        balance: 0
      }));

    // Combine all transactions
    const transactions: Transaction[] = [
      ...deliveryTransactions,
      ...payments.map((p) => ({
        date: p.payment_date,
        concept: `Pago - ${p.payment_method}${p.notes ? ` - ${p.notes}` : ''}`,
        debit: 0,
        credit: p.amount,
        type: "payment" as const,
        balance: 0
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    transactions.forEach((t) => {
      runningBalance = runningBalance + t.debit - t.credit;
      t.balance = runningBalance;
    });

    const response: BalanceResponse = {
      carrier,
      transactions,
      totalBalance: runningBalance
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error fetching carrier balance:", error);
    return res.status(500).json({ error: error.message });
  }
}
