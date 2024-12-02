import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { DeliveryScheduleEmail } from '@/components/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerName, email, scheduledDate, products, address } = req.body;

    if (!email || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await resend.emails.send({
      from: 'ROHI Sommiers <info@rohisommiers.com>',
      to: email,
      subject: 'Tu entrega ha sido programada - ROHI Sommiers',
      react: DeliveryScheduleEmail({
        customerName,
        scheduledDate,
        products,
        address,
      }),
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: 'Error sending email' });
  }
}