// pages/reset-password.tsx
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/component";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function handleAuthStateChange() {
      // Listen for auth state changes
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session && !window.location.hash && !router.query.token) {
        router.push("/login");
      }
    }

    handleAuthStateChange();
  }, [router, supabase.auth]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(
          "Error al actualizar la contraseña. Por favor, intente nuevamente."
        );
        return;
      }

      setMessage("Contraseña actualizada correctamente");

      // Sign out after password reset
      await supabase.auth.signOut();

      // Redirect after a short delay
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError("Ha ocurrido un error. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Nueva Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                Nueva Contraseña
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="Ingresá tu nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handlePasswordReset}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
