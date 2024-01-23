import prisma from '../../../lib/prisma';

// Define the interface for your data object
interface EntregaData {
  punto_venta: any;
  fecha: any;
  producto: any;
  domicilio: any;
  nombre: any;
  celular: any;
  pagado: any;
  new_notas?: {
    create: {
      content: string;
    };
  };
  fecha_programada?: string; // Make 'fecha_programada' an optional property
}

// POST /api/post
export default async function handle(req, res) {
  const { punto_venta, fecha, producto, domicilio, nombre, celular, pagado, newNotaContent, fecha_programada } = req.body;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const timestamp = formatDate(new Date().toISOString());
  const appendedContent = `${newNotaContent} | ${timestamp}`;

  // Use the EntregaData interface for the data object
  const data: EntregaData = {
    punto_venta: punto_venta,
    fecha: fecha,
    producto: producto,
    domicilio: domicilio,
    nombre: nombre,
    celular: celular,
    pagado: pagado,
    new_notas: newNotaContent ? {
      create: {
        content: appendedContent
      }
    } : undefined
  };

  // Add 'fecha_programada' to the data object if it's not an empty string
  if (fecha_programada && fecha_programada.trim() !== '') {
    data.fecha_programada = fecha_programada;
  }

  const result = await prisma.entrega.create({
    data: data,
    include: {
      new_notas: true
    }
  });

  res.json(result);
}
