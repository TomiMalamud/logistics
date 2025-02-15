// components/ProductList.tsx
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
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
  onCurrentProductChange?: (product: ProductItem) => void;
}

const FormField = ({ label, children, error }: FormFieldProps) => (
  <div className="mb-2">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const ProductList = ({
  products,
  onChange,
  onCurrentProductChange,
}: ProductListProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [includeERP, setIncludeERP] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = useProducts({
    query: search,
    includeERP,
  });

  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: "",
    sku: "",
    name: "",
    quantity: 1,
  });

  // Notify parent component when currentProduct changes
  useEffect(() => {
    onCurrentProductChange?.(currentProduct);
  }, [currentProduct, onCurrentProductChange]);

  const debouncedSearch = useDebouncedCallback(
    (value: string) => setSearch(value),
    500
  );

  const handleSearch = (value: string) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleProductSelect = (product: any) => {
    // If it's a local product (has lowercase properties)
    if ("sku" in product) {
      setCurrentProduct((prev) => ({
        ...prev,
        id: product.sku,
        sku: product.sku,
        name: titleCase(product.name.toLowerCase()),
      }));
    }
    // If it's an ERP product (has uppercase properties)
    else {
      setCurrentProduct((prev) => ({
        ...prev,
        id: product.Id || product.Codigo, // Some ERP responses might use different fields
        sku: product.Codigo,
        name: titleCase(product.Nombre.toLowerCase()),
      }));
    }
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
                  disabled={isLoading}
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
                      value={inputValue}
                      onValueChange={handleSearch}
                    />
                  </div>
                  <CommandList>
                    {search === "" ? (
                      <CommandEmpty>Escribí para buscar productos</CommandEmpty>
                    ) : isLoading ? (
                      <Loader size={16} className="m-4 mx-auto animate-spin" />
                    ) : (
                      <>
                        {/* Local Results */}
                        {data?.local.length > 0 && (
                          <CommandGroup heading="Productos de la app">
                            {data.local.map((product) => (
                              <CommandItem
                                key={product.sku}
                                value={product.name}
                                onSelect={() => handleProductSelect(product)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    currentProduct.sku === product.sku
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="text-sm text-gray-500 mr-2">
                                  {product.sku}
                                </span>
                                {titleCase(product.name.toLowerCase())}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {/* Search in ERP Button */}
                        {!includeERP && (
                          <Button
                            variant="ghost"
                            className="w-full h-10 justify-start px-2"
                            onClick={() => setIncludeERP(true)}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Buscar en ERP
                          </Button>
                        )}

                        {/* ERP Results */}
                        {includeERP && data?.erp.length > 0 && (
                          <CommandGroup heading="Productos ERP">
                            {data.erp.map((product) => (
                              <CommandItem
                                key={product.Codigo}
                                value={product.Nombre}
                                onSelect={() =>
                                  handleProductSelect({
                                    sku: product.Codigo,
                                    name: product.Nombre,
                                  })
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    currentProduct.sku === product.Codigo
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
                      </>
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
                  quantity: parseInt(e.target.value) || 1,
                }))
              }
              required
            />
          </FormField>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddProduct}
          disabled={!currentProduct.id}
        >
          Agregar
        </Button>
        {currentProduct.id && (
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setCurrentProduct({ id: "", sku: "", name: "", quantity: 1 })
            }
          >
            Cancelar
          </Button>
        )}
      </div>

      {products.length > 0 && (
        <div className="mt-4  bg-gray-50 rounded-lg overflow-hidden">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                "flex group items-center justify-between p-2 min-h-12",
                index !== products.length - 1 && "border-b border-b-slate-200"
              )}
            >
              <div className="space-x-2 flex-1 items-center">
                <span className="mx-2 text-sm font-bold">
                  {product.quantity}
                </span>
                <span className="text-sm text-gray-900">{product.name}</span>
                <span className="text-sm text-gray-500">{product.sku}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveProduct(product.id)}
                className="h-6 w-6 hidden group-hover:inline-flex"
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
