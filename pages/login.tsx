import { useRouter } from 'next/router'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/component'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ResetPassword from '@/components/ResetPassword'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  async function logIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' 
          ? 'Email o contraseña incorrecta'
          : 'Ha ocurrido un error. Por favor, intente nuevamente.'
        )
        return
      }

      // The middleware will handle the redirect
      if (data?.session) {
        router.push('/')
      }
    } catch (err) {
      setError('Ha ocurrido un error. Por favor, intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <ResetPassword onBack={() => setShowResetPassword(false)} />
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">App Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={logIn} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="Ingresá tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresá tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button
              type="button"
              variant="link"
              className="text-sm text-gray-500 p-0 h-auto"
              onClick={() => setShowResetPassword(true)}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={logIn} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}