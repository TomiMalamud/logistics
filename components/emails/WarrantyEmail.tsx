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
  
  interface WarrantyEmailProps {
    customerName: string;
  }
  
  export const WarrantyEmail = ({
    customerName,
  }: WarrantyEmailProps) => {
    const previewText = `Activación de garantía Gani`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-white my-auto mx-auto font-sans">
            <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Activación de Garantía
              </Heading>
  
              <Text className="text-black text-[14px] leading-[24px] capitalize">
                ¡Hola {customerName.toLocaleLowerCase()}!
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                Gracias por tu compra. GANI requiere que te registres en su base de datos para activar la garantía:
              </Text>
  
              <Section className="bg-[#f6f6f6] p-[20px] rounded-lg">
                <Text className="text-black text-[14px] leading-[24px] m-0">
                  1. Ingresá a <Link href="https://garantias.gani.com.ar/register">garantias.gani.com.ar/register</Link>
                </Text>
                <Text className="text-black text-[14px] leading-[24px] m-0">
                  2. Seguí las instrucciones para registrarte y activar la garantía
                </Text>
                <Text className="text-black text-[14px] leading-[24px] m-0">
                  3. Guardá el comprobante de activación
                </Text>
              </Section>
  
              <Text className="text-black text-[14px] leading-[24px]">
                Recordá que tenés 30 días desde la fecha de entrega para activar la garantía. Si ya la activaste, podés desestimar el mensaje. ¡Gracias!
              </Text>
  
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
  
              <Text className="text-black text-[14px] leading-[24px] font-bold">
                ROHI Sommiers
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default WarrantyEmail;