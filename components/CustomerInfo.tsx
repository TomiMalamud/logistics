import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { titleCase } from "title-case";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CustomerInfoProps {
  address: string;
  phone: string;
  email: string | null;
  isLoading: boolean;
  phoneError?: string;
  addressError?: string;
  emailError?: string;
  onBypassEmail: (reason: string) => void;
  emailBypassReason?: string;
}

export const CustomerInfo = ({
  address,
  phone,
  email,
  isLoading,
  phoneError,
  addressError,
  emailError,
  onBypassEmail,
  emailBypassReason
}: CustomerInfoProps) => {
  const [bypassReason, setBypassReason] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleBypassSubmit = () => {
    if (bypassReason.trim()) {
      onBypassEmail(bypassReason);
      setIsDialogOpen(false);
      setBypassReason("");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <span className={`text-gray-700`}>
              {address ? titleCase(address.toLowerCase()) : 'Dirección requerida'}
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <span className={`text-gray-700 ${phoneError ? 'text-destructive' : ''}`}>
              {phone || 'Teléfono requerido'}
            </span>
          </div>
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <Mail className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
              <span className={`text-gray-700 ${emailError ? 'text-destructive' : ''}`}>
                {email || emailBypassReason || 'Email requerido'}
              </span>
            </div>
            {!email && !emailBypassReason && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Sin email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Por qué no tenemos el email?</DialogTitle>
                    <DialogDescription>
                      Explicá por qué no podemos obtener el email del cliente
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={bypassReason}
                    onChange={(e) => setBypassReason(e.target.value)}
                    placeholder="Ej: Cliente no tiene email / No quiso compartirlo"
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button
                      onClick={handleBypassSubmit}
                      disabled={!bypassReason.trim()}
                    >
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {(phoneError || addressError || emailError) && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error en los datos del cliente</AlertTitle>
            <AlertDescription>
              {phoneError || addressError || emailError} Actualizalos en Contablium y reintentá.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerInfo;