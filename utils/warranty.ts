const WEBHOOK_URL = process.env.PERFIT_WEBHOOK;

export async function triggerWarrantyEmail(customerEmail: string) {
  if (!WEBHOOK_URL) {
    console.error('Missing PERFIT_WEBHOOK environment variable');
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger_key: 'garantia_gani',
        contact: customerEmail,
        context: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`Warranty email triggered for ${customerEmail}`);
  } catch (error) {
    console.error('Error triggering warranty email:', error);
  }
}