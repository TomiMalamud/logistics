// pages/api/get-invoice/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getComprobanteById, getInventarios } from '@/lib/api';

// Define types for the invoice items
interface InvoiceItem {
  Id: number;
  Cantidad: number;
  Concepto: string;
  PrecioUnitario: number;
  Iva: number;
  Bonificacion: number;
  Codigo: string;
}

type SuccessResponse = {
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }


  try {
    const response = await getInventarios();
    
    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}