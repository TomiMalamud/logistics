// pages/api/invoices/[id].ts
import { getComprobanteById } from "@/lib/api";
import { INVENTORY_LOCATIONS } from "@/utils/constants";
import type { NextApiRequest, NextApiResponse } from "next";

interface InvoiceItem {
  Id: number;
  Cantidad: number;
  Concepto: string;
  Codigo: string;
}

type SuccessResponse = {
  inventarioNombre: string;
  Saldo: string;
  Items: InvoiceItem[];
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
    const locationName = INVENTORY_LOCATIONS[inventoryId] ?? "Unknown Location";

    return res.status(200).json({
      inventarioNombre: locationName,
      Saldo: invoice.Saldo,
      Items: invoice.Items.map((item) => ({
        Cantidad: item.Cantidad,
        Concepto: item.Concepto,
        Codigo: item.Codigo
      }))
    });
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
}
