// pages/api/search-comprobantes/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { searchComprobantes } from '@/lib/api';
import { SearchComprobanteResponse } from '@/types/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const data: SearchComprobanteResponse = await searchComprobantes();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in searchComprobantes API route:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
