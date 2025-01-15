// components/ProductList.tsx
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useProducts } from "@/lib/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader, X } from "lucide-react";
import { useState } from "react";
import { titleCase } from "title-case";
import { useDebouncedCallback } from "use-debounce";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
}

interface ProductListProps {
  products: ProductItem[];
  onChange: (products: ProductItem[]) => void;
}

const FormField = ({ label, children, error }: FormFieldProps) => (
  <div className="mb-2">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const ProductList = ({ products, onChange }: ProductListProps) => {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: productsData, isLoading: isLoadingProducts } =
    useProducts(searchQuery);

  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: "",
    sku: "",
    name: "",
    quantity: 1
  });

  const debouncedSearch = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    500
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleProductSelect = (product: any) => {
    setCurrentProduct((prev) => ({
      ...prev,
      id: product.Id,
      sku: product.Codigo,
      name: titleCase(product.Nombre.toLowerCase())
    }));
    setOpen(false);
  };

  const handleAddProduct = () => {
    if (!currentProduct.id || !currentProduct.name) return;
    if (products.some((p) => p.id === currentProduct.id)) return;

    onChange([...products, { ...currentProduct }]);
    setCurrentProduct({ id: "", sku: "", name: "", quantity: 1 });
  };

  const handleRemoveProduct = (productId: string) => {
    onChange(products.filter((p) => p.id !== productId));
  };

  return (
    <div>
      <div className="flex gap-4">
        <div className="flex-1">
          <FormField label="Producto">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal"
                  disabled={isLoadingProducts}
                >
                  {currentProduct.id
                    ? currentProduct.name
                    : "Seleccioná un producto"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <div className="flex items-center border-b px-3">
                    <CommandInput
                      placeholder="Buscar producto..."
                      value={search}
                      onValueChange={handleSearch}
                    />
                  </div>
                  <CommandList>
                    {search === "" ? (
                      <CommandEmpty className="py-6 text-center text-sm">
                        Escribí para buscar productos
                      </CommandEmpty>
                    ) : isLoadingProducts ? (
                      <Loader size={16} className="m-4 mx-auto animate-spin" />
                    ) : !productsData?.Items?.length ? (
                      <CommandEmpty>No se encontraron productos</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {productsData.Items.map((product) => (
                          <CommandItem
                            key={product.Id}
                            value={titleCase(product.Nombre.toLowerCase())}
                            onSelect={() => handleProductSelect(product)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentProduct.id === product.Id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="text-sm text-gray-500 mr-2">
                              {product.Codigo}
                            </span>
                            {titleCase(product.Nombre.toLowerCase())}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormField>
        </div>
        <div className="w-24">
          <FormField label="Cantidad">
            <Input
              type="number"
              min="1"
              value={currentProduct.quantity}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 1
                }))
              }
              required
            />
          </FormField>
        </div>
      </div>
      <div className="flex items-center mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddProduct}
          disabled={!currentProduct.id}
        >
          Agregar
        </Button>
      </div>

      {products.length > 0 && (
        <div className="mt-4 space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex group items-center justify-between p-2 bg-gray-50 min-h-12 rounded-md"
            >
              <div className="space-x-2 flex-1">
                <span className="text-sm text-gray-500">{product.sku}</span>
                <span className="text-gray-900">{product.name}</span>
                <span className="ml-2 text-gray-500">{product.quantity}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveProduct(product.id)}
                className="h-8 w-8 hidden group-hover:inline-flex"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
