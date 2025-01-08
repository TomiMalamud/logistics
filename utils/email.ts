// utils/email.ts
import { isEmailValid } from './emailVal';

const WEBHOOK_URL = process.env.PERFIT_WEBHOOK;

export async function triggerEmail(customerEmail: string, trigger_key: string) {
  if (!WEBHOOK_URL) {
    console.error('Missing PERFIT_WEBHOOK environment variable');
    return;
  }

  if (!isEmailValid(customerEmail)) {
    console.warn(`Invalid or blocked email address: ${customerEmail}`);
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger_key: trigger_key,
        contact: customerEmail,
        context: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`Email triggered for ${customerEmail}`);
  } catch (error) {
    console.error('Error triggering email:', error);
  }
}