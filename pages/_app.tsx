import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import '../styles/globals.css'

const publicPages = ['/login']

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user && !publicPages.includes(router.pathname)) {
    router.push('/login')
    return null
  }

  return (
      <Component {...pageProps} />    
  )
}

export default MyApp