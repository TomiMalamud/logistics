// pages/api/get-invoice/index.ts
import { getComprobanteById } from '@/lib/api';
import { INVENTORY_LOCATIONS } from '@/utils/constants';
import type { NextApiRequest, NextApiResponse } from 'next';

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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { invoice_id } = req.query;

  if (!invoice_id || Array.isArray(invoice_id)) {
    return res.status(400).json({ error: 'Invalid or missing invoice_id parameter' });
  }

  const id = parseInt(invoice_id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'invoice_id must be a valid number' });
  }

  try {
    const invoice = await getComprobanteById(id);
    const inventoryId = invoice.Inventario.toString()
    const locationName = INVENTORY_LOCATIONS[inventoryId] ?? 'Unknown Location';
    
    return res.status(200).json({
      inventarioNombre: locationName,
      Saldo: invoice.Saldo,
      Items: invoice.Items.map(item => ({
        Cantidad: item.Cantidad,
        Concepto: item.Concepto,
        Codigo: item.Codigo
      }))
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}