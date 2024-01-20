import { Badge } from './ui/badge';

const PaymentStatusBadge = ({ isPaid }) => {
  const badgeStyles = isPaid
    ? "bg-slate-50 border-slate-400 text-slate-600 font-normal"
    : "bg-yellow-50 border-yellow-400 text-slate-600 font-normal";

  return (
    <Badge
      variant="outline"
      className={badgeStyles}
    >
      {isPaid ? 'Pagado' : 'Pago en Proceso'}
    </Badge>
  );
};

export default PaymentStatusBadge;
