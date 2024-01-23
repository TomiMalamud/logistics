export type EntregaProps = {
    id: string;
    punto_venta: string;
    fecha: Date;
    producto: string;
    domicilio: string;
    nombre: string;
    celular: string;
    notas: string;
    new_notas?: string[];
    estado: boolean;
    pagado: boolean;
    fecha_programada: Date;
    fetchURL?: string;
  };
  
  export type NotaType = {
    id: string;
    content: string;
    entrega_id: string;
  };
  