// /api/feed.ts

import prisma from '../../lib/prisma';

export default async function handle(req, res) {
  const feed = await prisma.entrega.findMany({
    where: {
      estado: true,
    },
    orderBy: [
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
