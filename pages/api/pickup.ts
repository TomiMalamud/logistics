// pages/api/deliveries/supplier-pickups.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {

    // Query deliveries with type = supplier_pickup
    // Include related data that might be useful for displaying the pickups
    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        id,
        order_date,
        products,
        scheduled_date,
        delivery_date,
        state,
        supplier_id,
        suppliers (
          name
        ),
        pickup_store
      `)
      .eq('type', 'supplier_pickup')
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.status(200).json(deliveries)
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}