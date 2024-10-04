// hoc/withAuth.tsx
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const withAuth = (WrappedComponent: React.ComponentType) => {
  const Wrapper: React.FC = (props) => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login')
      }
    }, [user, loading, router])

    if (loading || !user) {
      return <div>Loading...</div>
    }

    return <WrappedComponent {...props} />
  }

  return Wrapper
}

export default withAuth
