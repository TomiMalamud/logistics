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
import { createClient } from "@/lib/utils/supabase/component";
import { useState } from "react";

const ResetPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const supabase = createClient();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setMessage({
          type: "error",
          text: "Ha ocurrido un error. Por favor, intente nuevamente."
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Te enviamos un email con las instrucciones para restablecer tu contraseña."
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Ha ocurrido un error. Por favor, intente nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Restablecer Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {message.text && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Ingresá tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto mr-2"
        >
          Volver
        </Button>
        <Button
          onClick={handleResetPassword}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Enviando..." : "Enviar Email"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResetPassword;
