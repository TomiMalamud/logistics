// lib/useRole.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/component'

export type Role = 'admin' | 'sales'

export function useRole() {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setRole(profile?.role as Role)
        }
      } catch (error) {
        console.error('Error fetching role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [supabase])

  return { role, loading, isAdmin: role === 'admin' }
}

// Utility functions for role checks
export const canAccessAdminRoutes = (role: Role | null) => role === 'admin'
export const canAccessSalesRoutes = (role: Role | null) => ['admin', 'sales'].includes(role as Role)