import prisma from '../../../lib/prisma';

// POST /api/post
export default async function handle(req, res) {
  const { punto_venta, fecha, producto, domicilio, nombre, celular, newNotaContent } = req.body;
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
  };
  
  const timestamp = formatDate(new Date().toISOString());
    const appendedContent = `${newNotaContent} | ${timestamp}`;
  
  const result = await prisma.entrega.create({
    data: {
      punto_venta: punto_venta,
      fecha: fecha,
      producto: producto,
      domicilio: domicilio,
      nombre: nombre,
      celular: celular,
      new_notas: newNotaContent ? {
        create: {
          content: appendedContent
        }
      } : undefined
    },
    include: {
      new_notas: true
    }
  });
  
  res.json(result);
}

