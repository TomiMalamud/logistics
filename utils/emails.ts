// utils/emails.ts
import { Resend } from "resend";
import DeliveryScheduleEmail from "@/components/emails/EmailSchedule";
import FollowUpEmail from "@/components/emails/FollowUpEmail";
import WarrantyEmail from "@/components/emails/WarrantyEmail";

const resend = new Resend(process.env.RESEND_API_KEY);



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

  try {
    // Schedule email 2 days after delivery
    const scheduledAt = "in 2 days";

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

export async function scheduleWarrantyEmail({
  email,
  customerName,
}: {
  email: string;
  customerName: string;
}) {
  if (!email || !email.includes("@")) {
    console.log("Invalid email, skipping warranty email");
    return;
  }

  try {
    const scheduledAt = "in 1 min";

    const response = await resend.emails.send({
      from: "ROHI Sommiers <info@rohisommiers.com>",
      to: email,
      subject: "Activación de garantía - ROHI Sommiers",
      react: WarrantyEmail({
        customerName,
      }),
      scheduledAt
    });

    console.log("Warranty email scheduled successfully:", response);
  } catch (error) {
    console.error("Failed to schedule warranty email:", {
      error,
      email,
      customerName
    });
  }
}
