import { Product } from "@/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import { titleCase } from "title-case";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const calculateDiscountPrice = (price: number) =>
    Math.floor(price * (1 - descuento / 100));
  const calculateMonthlyPrice = (price: number) => Math.floor(price / 12);
  const descuento = 30;

  return (
    <Card className="hover:bg-gray-100 transition mb-2">
      <a
        href={`https://rohisommiers.com/search/?q=${product.Codigo}`}
        target="_blank"
        rel="noreferrer"
      >
        <CardHeader className="pb-4">
          <CardTitle>{titleCase(product.Nombre.toLowerCase())}</CardTitle>
          <CardDescription>
            {product.Codigo} | Stock: {product.Stock}
          </CardDescription>
        </CardHeader>
        <CardContent className="font-bold text-green-600 py-1 justify-between border-b border-gray-300 flex items-center">
          <div className="text-gray-500">
            $ {product.PrecioFinal.toLocaleString("es-AR")}
          </div>
          <div>
            12x ${" "}
            {calculateMonthlyPrice(product.PrecioFinal).toLocaleString("es-AR")}
          </div>
        </CardContent>
        <CardFooter className="justify-between flex items-center text-gray-500 pt-2 -mb-4">
          <div>Contado {descuento}% OFF</div>
          <div>
            ${" "}
            {calculateDiscountPrice(product.PrecioFinal).toLocaleString(
              "es-AR"
            )}
          </div>
        </CardFooter>
      </a>
    </Card>
  );
};
