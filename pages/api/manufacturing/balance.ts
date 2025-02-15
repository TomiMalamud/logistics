import { supabase } from "@/lib/supabase";
import { ManufacturingStatus } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";

export type Transaction = {
  date: string;
  concept: string;
  debit: number;
  credit: number;
  balance: number;
  type: "order" | "payment";
  order_id?: number;
};

export type BalanceResponse = {
  transactions: Transaction[];
  totalBalance: number;
  initialBalance: number;
  totalPending: number;
};

type OrderWithDetails = {
  id: number;
  completed_at: string;
  product_name: string;
  extras: string | null;
  status: ManufacturingStatus;
  price: number;
  deliveries: {
    id: number;
    invoice_number: string | null;
    customers: {
      name: string;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filterDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Get total pending (all completed but not paid orders)
    const { data: pendingData, error: pendingError } = await supabase
      .from("manufacturing_orders")
      .select("price")
      .eq("status", "completed");

    if (pendingError) throw pendingError;

    // Get total paid before filter date (for initial balance)
    const { data: paidData, error: paidError } = await supabase
      .from("manufacturing_orders")
      .select("price")
      .eq("status", "paid")
      .lt("completed_at", filterDate);

    if (paidError) throw paidError;

    const total_pending = pendingData.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );
    const initialBalance = paidData.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );

    // Fetch all completed orders and paid orders within 30-day window
    const { data: orders, error: ordersError } = await supabase
      .from("manufacturing_orders")
      .select(
        `
        id,
        completed_at,
        product_name,
        extras,
        status,
        price,
        deliveries (
          id,
          invoice_number,
          customers (
            name
          )
        )
      `
      )
      .or(
        `status.eq.completed,and(status.eq.paid,completed_at.gte.${filterDate})`
      )
      .order("completed_at");

    if (ordersError) throw ordersError;

    // Fetch payments within 30-day window
    const { data: payments, error: paymentsError } = await supabase
      .from("manufacturing_payments")
      .select("*")
      .gte("payment_date", filterDate)
      .order("payment_date");

    if (paymentsError) throw paymentsError;

    // Process orders to transactions
    const orderTransactions = (orders as unknown as OrderWithDetails[]).map(
      (order) => ({
        date: order.completed_at,
        concept: `${order.product_name}${
          order.extras ? ` + ${order.extras}` : ""
        } - ${order.deliveries.customers.name}${
          !order.price ? " (Pendiente de precio)" : ""
        }`,
        debit: order.price || 0,
        credit: 0,
        type: "order" as const,
        order_id: order.id,
        balance: 0,
      })
    );

    // Combine all transactions
    const transactions: Transaction[] = [
      ...orderTransactions,
      ...payments.map((p) => ({
        date: p.payment_date,
        concept: `Pago - ${
          p.payment_method === "cash" ? "Efectivo" : "Transferencia"
        }${p.notes ? ` - ${p.notes}` : ""}`,
        debit: 0,
        credit: p.amount,
        type: "payment" as const,
        balance: 0,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance starting from initialBalance
    let runningBalance = initialBalance;
    transactions.forEach((t) => {
      runningBalance = runningBalance + t.debit - t.credit;
      t.balance = runningBalance;
    });

    const response: BalanceResponse = {
      transactions,
      initialBalance,
      totalBalance: runningBalance,
      totalPending: total_pending,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching manufacturer balance:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
