import ResetPassword from "@/components/ResetPassword";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/component";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  async function logIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Email o contraseña incorrecta"
            : "Ha ocurrido un error. Por favor, intente nuevamente."
        );
        return;
      }

      if (data?.session) {
        router.push("/");
      }
    } catch (err) {
      setError("Ha ocurrido un error. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (showResetPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <ResetPassword onBack={() => setShowResetPassword(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-md mt-20 container mx-auto min-h-screen bg-gray-50">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Logística
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={logIn} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
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
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
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
        <CardFooter className="">
          <Button
            onClick={logIn}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </CardFooter>
      </Card>
      <div className="text-center text-sm leading-loose text-muted-foreground mt-4">
        <p>
          Built by{" "}
          <a
            href="https://www.tmalamud.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Tomás Malamud
          </a>
        </p>
        <p>
          The source code is available on{" "}
          <a
            href="https://github.com/TomiMalamud/logistics"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
