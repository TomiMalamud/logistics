import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface EmailTemplateProps {
  customerName: string;
  scheduledDate: string;
  phone: string;
  address: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.getTime() ? 
    date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    }) : 
    "Fecha inválida";
};

export const DeliveryScheduleEmail = ({
  customerName,
  scheduledDate,
  phone,
  address,
}: EmailTemplateProps) => {
  const previewText = `Entrega programada para ${formatDate(scheduledDate)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Entrega Programada
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              ¡Hola {customerName}!
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Agendamos tu entrega para el {formatDate(scheduledDate)} entre las 10:00 y las 20:00.
            </Text>

            <Section className="bg-[#f6f6f6] p-[20px] rounded-lg">
              <Heading className="text-black text-[18px] font-normal mt-0">
                Detalles de la entrega
              </Heading>
              <Text className="text-black text-[14px] leading-[24px] m-0">
                <strong>Dirección:</strong> {address}
              </Text>
              <Text className="text-black text-[14px] leading-[24px] m-0">
                <strong>Teléfono:</strong> {phone}
              </Text>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Te vamos a contactar antes de la entrega para confirmar el horario exacto.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Para cuidar tu compra, si durante el día de la entrega llueve reprogramaremos la entrega.
            </Text>

            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                Si tenés alguna pregunta, podés:
              </Text>
              <Text className="text-black text-[14px] leading-[24px] ml-[20px]">
                • Llamar a tu vendedor si es urgente
              </Text>
              <Text className="text-black text-[14px] leading-[24px] ml-[20px]">
                • <Link href="https://wa.me/543541207493">Enviarnos un WhatsApp</Link>
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-black text-[14px] leading-[24px]">
              ¡Gracias por tu compra!
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px] font-bold">
              ROHI Sommiers
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DeliveryScheduleEmail;