import type { NextApiRequest, NextApiResponse } from 'next';
import { searchClients } from '../../../lib/api';
import { GetClientByDocResponse } from '../../../types/api';

type Data = GetClientByDocResponse | { message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { filtro } = req.query;

  // Validate query parameters
  if (typeof filtro !== 'string') {
    return res.status(400).json({ message: 'Invalid query parameters' });
  }

  try {
    const clients = await searchClients(filtro);
    res.status(200).json(clients);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
