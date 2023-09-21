import prisma from '../../../lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const entregaId = req.query.id;
  const { method } = req;

  if (method !== 'PUT') {
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const entrega = await prisma.entrega.findUnique({
    where: { id: String(entregaId) },
  });

  if (!entrega) {
    return res.status(404).json({ error: 'Entrega not found' });
  }

  const { estado, new_notas, pagado } = req.body;

  try {
    const updatedEntrega = await prisma.entrega.update({
      where: { id: String(entregaId) },
      data: {
        estado: estado !== undefined ? estado : entrega.estado,
        pagado: pagado !== undefined ? pagado : entrega.pagado,
        new_notas: {
            create: new_notas !== undefined ? new_notas.map(note => ({content: note})) : undefined
          },
            },
    });

    return res.status(200).json(updatedEntrega);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
