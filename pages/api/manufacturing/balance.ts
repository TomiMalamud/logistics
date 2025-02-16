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
};

type OrderWithDetails = {
  id: number;
  finished_at: string;
  product_name: string;
  extras: string | null;
  status: ManufacturingStatus;
  price: number;
  notes: string | null;
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

    // Get total finished orders before filter date (for initial balance)
    const { data: finishedData, error: finishedError } = await supabase
      .from("manufacturing_orders")
      .select("price")
      .eq("status", "finished")
      .lt("finished_at", filterDate);

    if (finishedError) throw finishedError;

    // Get total payments before filter date (for initial balance)
    const { data: previousPayments, error: previousPaymentsError } =
      await supabase
        .from("manufacturing_payments")
        .select("amount")
        .lt("payment_date", filterDate);

    if (previousPaymentsError) throw previousPaymentsError;

    const totalFinishedBefore = finishedData.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );

    const totalPaymentsBefore = previousPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Initial balance is finished orders minus payments before filter date
    const initialBalance = totalFinishedBefore - totalPaymentsBefore;

    // Fetch all finished orders within 30-day window
    const { data: orders, error: ordersError } = await supabase
      .from("manufacturing_orders")
      .select(
        `
        id,
        finished_at,
        product_name,
        extras,
        status,
        price,
        notes,
        deliveries (
          id,
          invoice_number,
          customers (
            name
          )
        )
      `
      )
      .eq("status", "finished")
      .gte("finished_at", filterDate)
      .order("finished_at");

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
        date: order.finished_at,
        concept: `${order.product_name}${
          order.extras ? ` + ${order.extras}` : ""
        }${
          order.deliveries?.customers?.name
            ? ` - ${order.deliveries.customers.name}`
            : ` (Pedido personalizado) ${
                order.notes ? ` - ${order.notes}` : ""
              }`
        }${!order.price ? " (Pendiente de precio)" : ""}`,
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
