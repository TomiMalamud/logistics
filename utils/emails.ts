// utils/emails.ts
import { Resend } from "resend";
import FollowUpEmail from "@/components/emails/FollowUpEmail";

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

