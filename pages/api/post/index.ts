import prisma from '../../../lib/prisma';

// POST /api/post
// Required fields in body: title
// Optional fields in body: content
export default async function handle(req, res) {
  const { punto_venta,fecha, producto, domicilio, nombre, celular, notas } = req.body;

  const result = await prisma.entrega.create({
    data: {
      punto_venta: punto_venta,
      fecha: fecha,
      producto: producto,
      domicilio: domicilio,
      nombre: nombre,
      celular: celular,
      notas: notas,
      
    },
  });
  res.json(result);
}