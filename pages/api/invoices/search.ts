// pages/api/invoices/search.ts
import { searchComprobantes } from "@/lib/api";
import { SearchComprobanteResponse } from "@/types/api";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const { start, end, vendedor } = req.query;

    if (
      (start && !isValidDate(start as string)) ||
      (end && !isValidDate(end as string))
    ) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const data: SearchComprobanteResponse = await searchComprobantes(
      undefined,
      start as string | undefined,
      end as string | undefined
    );

    if (vendedor && vendedor !== "all") {
      const vendedorId = Number(vendedor);
      if (isNaN(vendedorId)) {
        return res.status(400).json({ message: "Invalid vendor ID format" });
      }
      data.Items = data.Items.filter(
        (comprobante) => comprobante.IDVendedor === vendedorId
      );
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error in searchComprobantes API route:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

function isValidDate(dateStr: string) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}
