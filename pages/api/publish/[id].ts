import prisma from '../../../lib/prisma';

// PUT /api/publish/:id
export default async function handle(req, res) {
  const entregaId = req.query.id;
  const entrega = await prisma.entrega.findUnique({
    where: { id: entregaId },
  });

  if (!entrega) {
    return res.status(404).json({ error: 'Entrega not found' });
  }

  const updatedEntrega = await prisma.entrega.update({
    where: { id: entregaId },
    data: { estado: !entrega.estado },
  });

  res.json(updatedEntrega);
}
