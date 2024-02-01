import prisma from '../../lib/prisma';

export default async function handle(req, res) {
  const feed = await prisma.entrega.findMany({
    orderBy: [
      {
        fecha_programada: 'asc',
      },
      {
        fecha: 'asc',
      },
    ],
    include: {
      new_notas: true,
    },
  });

  res.json(feed);
}
