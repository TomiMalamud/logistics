// utils/emails.ts
import { Resend } from "resend";
import DeliveryScheduleEmail from "@/components/EmailSchedule";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeliveryScheduleEmail({
  email,
  customerName,
  scheduledDate,
  phone,
  address,
}: {
  email: string;
  customerName: string;
  scheduledDate: string;
  phone: string;
  address: string;
}) {
  if (!email) return;
  
  try {
    await resend.emails.send({
      from: 'ROHI Sommiers <info@rohisommiers.com>',
      to: email,
      subject: 'Entrega agendada - ROHI Sommiers',
      react: DeliveryScheduleEmail({
        customerName,
        scheduledDate,
        phone,
        address,
      }),
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw - email sending shouldn't break the main flow
  }
}