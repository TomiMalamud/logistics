import React from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from './ui/alert-dialog';
import { Button } from './ui/button';

const PaymentStatusDialog = ({ isPaid, onConfirm, onDisabled }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button className="mx-4" variant={isPaid ? 'link':'outline'} disabled={onDisabled}>{isPaid ? 'Marcar como Pago Pendiente' : 'Marcar como Pago Recibido'}</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isPaid ? 'El cliente debe un saldo' : 'Entrega cobrada en su totalidad'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {isPaid
            ? '¿Estás seguro que querés marcar el pago como pendiente?'
            : '¿Estás seguro que querés marcar el pago como recibido?'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default PaymentStatusDialog;
