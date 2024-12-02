interface EmailTemplateProps {
  customerName: string;
  scheduledDate: string;
  products: string;
  address: string;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });
  };

export const DeliveryScheduleEmail = ({
  customerName,
  scheduledDate,
  products,
  address,
}: EmailTemplateProps) => 
    (
  <div>
    <h1>Entrega Programada - ROHI Sommiers</h1>
    <p>Hola {customerName},</p>
    <p>Tu entrega ha sido programada para el {formatDate(scheduledDate)}.</p>
    
    <div>
      <h2>Detalles de la entrega:</h2>
      <ul>
        <li><strong>Productos:</strong> {products}</li>
        <li><strong>Dirección:</strong> {address}</li>
      </ul>
    </div>

    <p>Te contactaremos antes de la entrega para confirmar el horario exacto.</p>
    
    <div>
      <p>Si tenés alguna pregunta, podés:</p>
      <ul>
        <li>Llamarnos al: [Teléfono de la tienda]</li>
        <li>Responder a este email</li>
      </ul>
    </div>

    <p>¡Gracias por tu compra!</p>
    <p>ROHI Sommiers</p>
  </div>
);

export default DeliveryScheduleEmail;