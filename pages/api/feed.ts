// pages/api/feed.js

import { supabase } from '../../lib/supabase'

export default async function handle(req, res) {
  try {
    const { data: feed, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        customers (
          nombre,
          domicilio,
          celular
        ),
        notes (
          id,
          text,
          created_at
        )
      `)
      .order('fecha_programada', { ascending: true })
      .order('fecha_venta', { ascending: true })

    if (error) {
      console.error('Error fetching deliveries:', error)
      return res.status(500).json({ error: 'Failed to fetch deliveries.' })
    }

    res.status(200).json(feed)
  } catch (err) {
    console.error('Unexpected error:', err)
    res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
