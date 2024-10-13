// pages/api/get-comprobante/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getComprobanteById } from '../../../lib/api';

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

  const { id_comprobante } = req.query;

  // Validate the id_comprobante parameter
  if (!id_comprobante || Array.isArray(id_comprobante)) {
    return res.status(400).json({ error: 'Invalid or missing id_comprobante parameter' });
  }

  const id = parseInt(id_comprobante, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'id_comprobante must be a valid number' });
  }

  try {
    // Fetch the comprobante using the provided ID
    const comprobante = await getComprobanteById(id);

    // Return the Saldo field
    return res.status(200).json({ Saldo: comprobante.Saldo });
  } catch (error: any) {
    console.error('Error fetching comprobante:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
