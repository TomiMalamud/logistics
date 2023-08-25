// /api/completedFeed.ts

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
  });

  res.json(feed);
}
