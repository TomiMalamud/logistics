// /api/feed.ts

import prisma from '../../lib/prisma';

export default async function handle(req, res) {
  const feed = await prisma.entrega.findMany({
    where: {
      estado: false,
    },
    orderBy: [
      {
        fecha: 'asc',
      },
    ],
  });

  res.json(feed);
}
