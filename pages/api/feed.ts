import { supabase } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

type FeedResponse = {
  feed: any[]
  page: number
  totalPages: number
  totalItems: number
}

type ErrorResponse = {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    state = 'pending', 
    page = '1', 
    pageSize = '40',
    search = '',
    scheduledDate = 'all'
  } = req.query

  if (!['pending', 'delivered'].includes(state as string)) {
    return res.status(400).json({ error: 'Invalid state parameter' })
  }

  if (!['all', 'hasDate', 'noDate'].includes(scheduledDate as string)) {
    return res.status(400).json({ error: 'Invalid scheduledDate parameter' })
  }

  try {
    const start = (Number(page) - 1) * Number(pageSize)
    const end = start + Number(pageSize) - 1

    let query = supabase
      .from('deliveries')
      .select(`
        *,
        customers!inner (
          name,
          address,
          phone
        ),
        notes (
          id,
          text,
          created_at
        ),
        created_by:profiles (
          email,
          name
        )`, { count: 'exact' })
      .eq('state', state)
      .range(start, end)

    // Apply search if present
    if (search) {
      const searchTerm = `*${search}*`
      query = query.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`, { 
        referencedTable: 'customers' 
      })
    }

    // Apply scheduled date filter
    if (scheduledDate === 'hasDate') {
      query = query.not('scheduled_date', 'is', null)
    } else if (scheduledDate === 'noDate') {
      query = query.is('scheduled_date', null)
    }

    // Apply sorting
    if (state === 'pending') {
      query = query
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('order_date', { ascending: true })
    } else {
      query = query.order('order_date', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      console.error(`Error fetching ${state} deliveries:`, error)
      return res.status(500).json({ error: 'Failed to fetch deliveries.' })
    }

    if (count === null || count === undefined) {
      return res.status(500).json({ error: 'Count not available' })
    }

    return res.status(200).json({
      feed: data,
      page: Number(page),
      totalPages: Math.ceil(count / Number(pageSize)),
      totalItems: count
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}