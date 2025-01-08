import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface FollowUpProps {
  customerName: string;
  salesPersonName: string;
  customerPhone: string;
}

export const FollowUp = ({
  customerName,
  salesPersonName,
  customerPhone
}: FollowUpProps) => {
  const previewText = `Seguimiento - ${customerName}`;

  // Mensaje para WhatsApp
  const message = `
¡Hola! ¿Cómo andás? Soy ${salesPersonName} de ROHI Sommiers.

Te escribo para ver qué tal te está resultando tu compra. ¿Ya la pudiste probar? Me interesa saber si cumple con lo que esperabas.
Si tenés alguna duda sobre cómo cuidarlo o cualquier otra consulta, ¡no dudes en preguntarme!
    
¡Gracias por confiar en ROHI Sommiers! Es un placer para nosotros que nos hayas elegido para mejorar tu descanso.`;

  // Crear el link de WhatsApp con el mensaje codificado
  const whatsappLink = `https://wa.me/549${customerPhone}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Seguimiento de Cliente
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              ¡Hola {salesPersonName}!
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Es momento de hacer el seguimiento con {customerName}: Ya pasaron 2 días desde la entrega.
            </Text>

            <Section className="mt-6 text-center">
              <Button
                href={whatsappLink}
                className="inline-block text-center bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg"
              >
                Enviar WhatsApp
              </Button>
            </Section>

            <Text className="text-gray-500 text-[12px] mt-4 text-center">
              Al hacer clic se abrirá WhatsApp con el mensaje prellenado
            </Text>

            <Text>
              Si la experiencia fue buena, enviale también el link de la opinión
              de Google (click derecho en cada link y copiar dirección de enlace):
              <ul>
                <li>
                  <Link href="https://g.page/r/CcenOiXzcmv3EBM/review">
                    9 de Julio
                  </Link>
                  {"\n"}
                </li>
                <li>
                  <Link href="https://g.page/r/CYA-vvLzx6fcEBM/review">
                    Cárcano
                  </Link>
                </li>
                <li>
                  <Link href="https://g.page/r/CYrwzz0vLt23EBM/review">
                    Centro Distribución
                  </Link>
                </li>
              </ul>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default FollowUp;
