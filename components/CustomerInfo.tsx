import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Edit2, Mail, MapPin, Phone } from "lucide-react";
import React from "react";
import { titleCase } from "title-case";

interface CustomerInfoProps {
  address: string;
  phone: string;
  email: string | null;
  isLoading: boolean;
  phoneError?: string;
  addressError?: string;
  emailError?: string;
  onBypassEmail: (reason: string) => void;
  onUpdateAddress: (address: string) => void;
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
  onUpdateAddress,
  emailBypassReason
}: CustomerInfoProps) => {
  const [bypassReason, setBypassReason] = React.useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = React.useState(false);
  const [editedAddress, setEditedAddress] = React.useState(address);

  const handleBypassSubmit = () => {
    if (bypassReason.trim()) {
      onBypassEmail(bypassReason);
      setIsEmailDialogOpen(false);
      setBypassReason("");
    }
  };

  const handleAddressSubmit = () => {
    if (editedAddress.trim()) {
      onUpdateAddress(editedAddress);
      setIsAddressDialogOpen(false);
    }
  };

  React.useEffect(() => {
    setEditedAddress(address);
  }, [address]);

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
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
              <span
                className={`text-gray-700 ${addressError && "text-red-500"}`}
              >
                {address
                  ? titleCase(address.toLowerCase())
                  : "Dirección requerida"}
              </span>
            </div>
            <Dialog
              open={isAddressDialogOpen}
              onOpenChange={setIsAddressDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar domicilio de entrega</DialogTitle>
                  <DialogDescription>
                    Sólo si el domicilio de facturación es distinto al de
                    entrega.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Domicilio de entrega</Label>
                  <Input
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    placeholder="Ej: Av. San Martín 1234 - Córdoba"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddressSubmit}
                    disabled={!editedAddress.trim()}
                  >
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <span className={`text-gray-700 ${phoneError && "text-red-500"}`}>
              {phone || "Teléfono requerido"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <Mail className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
              <span className={`text-gray-700 ${emailError && "text-red-500"}`}>
                {email || emailBypassReason || "Email requerido"}
              </span>
            </div>
            {!email && !emailBypassReason && (
              <Dialog
                open={isEmailDialogOpen}
                onOpenChange={setIsEmailDialogOpen}
              >
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
              {phoneError || addressError || emailError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerInfo;
