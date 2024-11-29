// pages/api/get-invoice_number/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getComprobanteById } from '@/lib/api';

type SuccessResponse = {
  Saldo: string;
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

  // Validate the invoice_id parameter
  if (!invoice_id || Array.isArray(invoice_id)) {
    return res.status(400).json({ error: 'Invalid or missing invoice_id parameter' });
  }

  const id = parseInt(invoice_id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'invoice_id must be a valid number' });
  }

  try {
    // Fetch the invoice_number using the provided ID
    const invoice_number = await getComprobanteById(id);

    // Return the Saldo field
    return res.status(200).json({ Saldo: invoice_number.Saldo });
  } catch (error: any) {
    console.error('Error fetching invoice_number:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
