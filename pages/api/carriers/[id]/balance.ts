// pages/api/carriers/[id]/balance.ts
import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { Database } from "@/supabase/types/supabase";

type DeliveryTypeEnum = Database["public"]["Enums"]["delivery_type"];

const querySchema = z.object({
  id: z.string().min(1, "Carrier ID is required"),
});

const transactionSchema = z
  .object({
    date: z.string(),
    concept: z.string(),
    debit: z.number(),
    credit: z.number(),
    balance: z.number(),
    type: z.enum(["delivery", "payment"]),
    delivery_id: z.number().optional(),
    delivery_type: z
      .enum(["supplier_pickup", "home_delivery", "store_movement"] as const)
      .optional(),
  })
  .strict();

const balanceResponseSchema = z
  .object({
    carrier: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .strict(),
    transactions: z.array(transactionSchema),
    totalBalance: z.number(),
    initialBalance: z.number(),
  })
  .strict();

export type Transaction = z.infer<typeof transactionSchema>;
export type BalanceResponse = z.infer<typeof balanceResponseSchema>;

type OperationWithDetails = {
  id: number;
  operation_date: string;
  cost: number;
  operation_type: string;
  deliveries: {
    id: number;
    invoice_number: string | null;
    type: DeliveryTypeEnum;
    customers: {
      name: string;
    } | null;
    suppliers: {
      name: string;
    } | null;
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

  try {
    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const { id } = result.data;

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

    // Calculate initial balance (before 30-day window)
    const { data: initialBalanceData, error: initialBalanceError } =
      await supabase.rpc("calculate_carrier_balance_before_date", {
        p_carrier_id: parseInt(id),
        p_date: filterDate,
      });

    if (initialBalanceError) throw initialBalanceError;

    const initialBalance = initialBalanceData || 0;

    // Fetch operations within 30-day window
    const { data: operations, error: operationsError } = await supabase
      .from("delivery_operations")
      .select(
        `
        id,
        operation_date,
        cost,
        operation_type,
        deliveries (
          id,
          invoice_number,
          type,
          customers (
            name
          ),
          suppliers (
            name
          )
        )
      `
      )
      .eq("carrier_id", id)
      .gte("operation_date", filterDate)
      .order("operation_date");

    if (operationsError) throw operationsError;

    // Fetch payments within 30-day window
    const { data: payments, error: paymentsError } = await supabase
      .from("carrier_payments")
      .select("*")
      .eq("carrier_id", id)
      .gte("payment_date", filterDate)
      .order("payment_date");

    if (paymentsError) throw paymentsError;

    // Process operations to transactions
    const operationTransactions = (
      operations as unknown as OperationWithDetails[]
    )
      .filter((op) => op.operation_type === "delivery")
      .map((op) => ({
        date: op.operation_date,
        concept: op.deliveries
          ? op.deliveries.type === "store_movement"
            ? "Movimiento de Mercadería"
            : op.deliveries.type === "supplier_pickup"
            ? `Retiro en ${
                op.deliveries.suppliers?.name || "Proveedor sin nombre"
              }`
            : op.deliveries.invoice_number
            ? `${op.deliveries.invoice_number} - ${
                op.deliveries.customers?.name || "Cliente sin nombre"
              }`
            : "Sin factura"
          : "Operación sin entrega",
        debit: op.cost,
        credit: 0,
        type: "delivery" as const,
        delivery_id: op.deliveries?.id,
        delivery_type: op.deliveries?.type,
        balance: 0,
      }));

    // Combine all transactions
    const transactions: Transaction[] = [
      ...operationTransactions,
      ...payments.map((p) => ({
        date: p.payment_date,
        concept: `Pago - ${p.payment_method}${p.notes ? ` - ${p.notes}` : ""}`,
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
      carrier,
      transactions,
      initialBalance,
      totalBalance: runningBalance,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error fetching carrier balance:", error);
    return res.status(500).json({ error: error.message });
  }
}
