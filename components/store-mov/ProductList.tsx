// components/store-movement/ProductList.tsx
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProductItem } from '@/lib/hooks/useStoreMovement';

interface ProductListProps {
  products: ProductItem[];
  onRemove: (id: string) => void;
}

export const ProductList = ({ products, onRemove }: ProductListProps) => {
  if (products.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
        >
          <div className="space-x-2 flex-1">
            <span className="text-sm text-gray-500">{product.code}</span>
            <span className="text-gray-900">{product.name}</span>
            <span className="ml-2 text-gray-500">{product.quantity}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemove(product.id)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};