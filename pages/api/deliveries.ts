// pages/api/deliveries.ts
import createClient from '@/utils/supabase/api'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { User } from '@supabase/supabase-js'

type FeedResponse = {
  feed: any[]
  page: number
  totalPages: number
  totalItems: number
}

type ErrorResponse = {
  error: string
}

type UserWithRole = User & {
  role?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(req, res)

  // Get authenticated user and their role
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get user role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching user role:', profileError)
    return res.status(500).json({ error: 'Failed to fetch user role' })
  }

  const {
    state = 'pending',
    page = '1',
    pageSize = '40',
    search = '',
    scheduledDate = 'all',
    type = 'all'
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

    // First, get customer IDs that match the search
    let customerQuery = supabase
      .from('customers')
      .select('id')
      
    if (search) {
      const searchTerm = `%${search}%`
      customerQuery = customerQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
    }

    const { data: customerIds, error: customerError } = await customerQuery
    
    if (customerError) {
      console.error('Error fetching customer ids:', customerError)
      return res.status(500).json({ error: 'Failed to fetch customers.' })
    }

    // Base query for deliveries
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        customers (
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
        ),
        suppliers (
          name
        ),
        carriers (
          name,
          phone
        )
      `, { count: 'exact' })
      .eq('state', state)

    // Apply role-based filtering
    if (profile.role === 'sales') {
      query = query.eq('created_by', user.id)
    }

    // Apply delivery type filter
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Apply search filter using customer IDs
    if (search && customerIds) {
      query = query.in('customer_id', customerIds.map(c => c.id))
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

    // Apply pagination
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) {
      console.error(`Error fetching ${state} deliveries:`, error)
      return res.status(500).json({ error: 'Failed to fetch deliveries.' })
    }
    
    if (!data || count === null || count === undefined) {
      return res.status(500).json({ error: 'Failed to fetch deliveries.' })
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