// pages/api/invoices/[id].ts
import { getComprobanteById } from "@/lib/api";
import { getStore } from "@/lib/utils/constants";
import { InvoiceItem } from "@/types/types";
import type { NextApiRequest, NextApiResponse } from "next";

type SuccessResponse = {
  inventoryId: string;
  balance: string;
  items: InvoiceItem[];
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid or missing id parameter" });
  }

  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "id must be a valid number" });
  }

  try {
    const invoice = await getComprobanteById(invoiceId);
    const inventoryId = invoice.Inventario.toString();
    
    // Validate if this is a known inventory location
    if (!getStore(inventoryId)) {
      console.warn(`Unknown inventory location: ${inventoryId}`);
    }

    return res.status(200).json({
      inventoryId,
      balance: invoice.Saldo,
      items: invoice.Items.map((item) => ({
        Codigo: item.Codigo,
        Cantidad: item.Cantidad,
        Concepto: item.Concepto
      }))
    });
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
}