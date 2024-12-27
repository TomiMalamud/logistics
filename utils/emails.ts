// utils/emails.ts
import { Resend } from "resend";
import DeliveryScheduleEmail from "@/components/EmailSchedule";
import FollowUpEmail from "@/components/FollowUpEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeliveryScheduleEmail({
  email,
  customerName,
  scheduledDate,
  phone,
  address
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
      from: "ROHI Sommiers <info@rohisommiers.com>",
      to: email,
      subject: "Entrega agendada - ROHI Sommiers",
      react: DeliveryScheduleEmail({
        customerName,
        scheduledDate,
        phone,
        address
      })
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw - email sending shouldn't break the main flow
  }
}

export async function scheduleFollowUpEmail({
  salesPersonEmail,
  salesPersonName,
  customerName,
  customerPhone
}: {
  salesPersonEmail: string;
  salesPersonName: string;
  customerName: string;
  customerPhone: string;
}) {
  if (!salesPersonEmail) {
    console.log("No sales person email provided, skipping follow-up email");
    return;
  }

  try {
    // Schedule email 2 days after delivery
    const scheduledAt = "in 2 days";

    console.log("Scheduling follow-up email:", {
      salesPersonEmail,
      customerName,
      scheduledAt,
      currentTime: new Date().toISOString()
    });

    const response = await resend.emails.send({
      from: "ROHI Sommiers <info@rohisommiers.com>",
      to: salesPersonEmail,
      subject: `Seguimiento - ${customerName}`,
      react: FollowUpEmail({
        customerName,
        salesPersonName,
        customerPhone
      }),
      scheduledAt
    });

    console.log("Email scheduled successfully:", response);
  } catch (error) {
    console.error("Failed to schedule follow-up email:", {
      error,
      salesPersonEmail,
      customerName
    });
  }
}
