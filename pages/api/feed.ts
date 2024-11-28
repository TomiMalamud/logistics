// pages/api/feed.ts
import { supabase } from '../../lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

// Type definitions
type SortConfig = {
  field: string
  ascending: boolean
}

type QueryConfig = {
  state: 'pending' | 'delivered'
  page: number
  pageSize: number
}

type FeedResponse = {
  feed: any[]
  page: number
  totalPages: number
  totalItems: number
}

type ErrorResponse = {
  error: string
}

// Pure function to generate sort configuration
const getSortConfig = (state: 'pending' | 'delivered'): SortConfig[] => ({
  pending: [
    { field: 'scheduled_date', ascending: true },
    { field: 'order_date', ascending: true }
  ],
  delivered: [
    { field: 'order_date', ascending: false }
  ]
}[state])

// Pure function to calculate pagination
const getPaginationRange = (page: number, pageSize: number) => ({
  start: (page - 1) * pageSize,
  end: (page - 1) * pageSize + pageSize - 1
})

// Pure function to build the query
const buildQuery = (config: QueryConfig) => {
  const { state, page, pageSize } = config
  const { start, end } = getPaginationRange(page, pageSize)
  const sortConfig = getSortConfig(state)
  
  let query = supabase
    .from('deliveries')
    .select(`
      *,
      customers (name, address, phone),
      notes (id, text, created_at),
      created_by:profiles (email, name)
    `, { count: 'exact' })
    .eq('state', state)
    .range(start, end)
  
  // Apply sort configurations
  sortConfig.forEach(({ field, ascending }) => {
    query = query.order(field, { ascending })
  })
  
  return query
}

// Pure function to format response
const formatResponse = (data: any[], count: number, page: number, pageSize: number): FeedResponse => ({
  feed: data,
  page: Number(page),
  totalPages: Math.ceil(count / pageSize),
  totalItems: count
})

// Main handler
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
    pageSize = '10' 
  } = req.query

  if (!['pending', 'delivered'].includes(state as string)) {
    return res.status(400).json({ error: 'Invalid state parameter' })
  }

  try {
    const query = buildQuery({
      state: state as 'pending' | 'delivered',
      page: Number(page),
      pageSize: Number(pageSize)
    })
    
    const { data: feed, error, count } = await query
    
    if (error) {
      console.error(`Error fetching ${state} deliveries:`, error)
      return res.status(500).json({ error: 'Failed to fetch deliveries.' })
    }

    if (!count) {
      return res.status(500).json({ error: 'Count not available' })
    }

    const response = formatResponse(feed, count, Number(page), Number(pageSize))
    return res.status(200).json(response)
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}