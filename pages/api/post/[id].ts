import prisma from '../../../lib/prisma';

// PUT /api/post/:id
export default async function handle(req, res) {
  const entregaId = req.query.id;
  const entrega = await prisma.entrega.findUnique({
    where: { id: entregaId },
  });

  if (!entrega) {
    return res.status(404).json({ error: 'Entrega not found' });
  }

  if (req.method === 'PUT') {
    const { notas } = req.body;

    const updatedEntrega = await prisma.entrega.update({
      where: { id: entregaId },
      data: { notas },
    });

    return res.json(updatedEntrega);
  }

  return res.status(400).json({ error: 'Invalid request method' });
}
