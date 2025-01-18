import { Concepto } from "@/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import FinancingOptions from "./FinancingOptions";
import { CASH_DISCOUNT } from "@/utils/constants";

interface ProductCardProps {
  product: Concepto;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const calculateDiscountPrice = (price: number) =>
    Math.floor(price * (1 - CASH_DISCOUNT / 100));  

  return (
    <Card className="transition mb-2">
      <CardHeader className="pb-4">
        <CardTitle className="capitalize">
          {product.Nombre.toLowerCase()}
        </CardTitle>
        <CardDescription>
          {product.Codigo} | Stock: {product.Stock}
        </CardDescription>
      </CardHeader>
      <CardContent className="font-bold text-green-600 py-1 justify-between border-b border-gray-300 flex items-center">
        <div className="text-gray-500 font-medium">
          $ {product.PrecioFinal.toLocaleString("es-AR")}
        </div>
        <div className="flex items-center gap-1">
          <FinancingOptions price={product.PrecioFinal} />
        </div>
      </CardContent>
      <CardFooter className="justify-between flex items-center text-gray-500 pt-2 -mb-4">
        <div>Contado {CASH_DISCOUNT}% OFF</div>
        <div className="font-bold">
          ${" "}
          {calculateDiscountPrice(product.PrecioFinal).toLocaleString("es-AR")}
        </div>
      </CardFooter>
    </Card>
  );
};
