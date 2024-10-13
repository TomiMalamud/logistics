// pages/api/customer/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientById } from '@/lib/api';
import type { Customer } from '@/types/api';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid or missing id parameter' });
  }

  try {
    const customer: Customer = await getClientById(Number(id));
    return res.status(200).json(customer);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
