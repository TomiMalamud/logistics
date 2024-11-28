// pages/api/delivery-counts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const [pendingCount, deliveredCount] = await Promise.all([
      supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'pending'),
      supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'delivered')
    ])

    if (pendingCount.error || deliveredCount.error) {
      throw new Error('Failed to fetch counts')
    }

    return res.status(200).json({
      pending: pendingCount.count ?? 0,
      delivered: deliveredCount.count ?? 0
    })
  } catch (error) {
    console.error('Error fetching counts:', error)
    return res.status(500).json({ error: 'Failed to fetch counts' })
  }
}