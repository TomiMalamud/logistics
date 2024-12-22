// components/CreateStoreMov.tsx
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Check, ChevronsUpDown, Loader } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { titleCase } from "title-case";
import { cn } from "@/lib/utils";
import { ProductList } from "./ProductList";
import {
  useStoreMovement,
  stores,
  StoreId
} from "@/lib/hooks/useStoreMovement";

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
}

const FormField = ({ label, children, error }: FormFieldProps) => (
  <div className="mb-2">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export default function CreateStoreMov({ user }: { user: User }) {
  const {
    formData,
    setFormData,
    currentProduct,
    setCurrentProduct,
    loading,
    error,
    search,
    handleSearch,
    handleProductSelect,
    open,
    setOpen,
    handleSubmit,
    productsData,
    isLoadingProducts
  } = useStoreMovement(user);

  const handleAddProduct = () => {
    if (!currentProduct.id || !currentProduct.name) return;
    if (formData.products.some((p) => p.id === currentProduct.id)) return;

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { ...currentProduct }]
    }));

    setCurrentProduct({ id: "", code: "", name: "", quantity: 1 });
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId)
    }));
  };

  const handleStoreChange =
    (type: "origin_store" | "dest_store") => (value: StoreId) => {
      setFormData((prev) => ({
        ...prev,
        [type]: value
      }));
    };
  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="">Movimiento entre Locales</CardTitle>
          <FormField>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduled_date: e.target.value
                }))
              }
              required
              className="w-36 -mt-2"
            />
          </FormField>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Origen">
              <Select
                value={formData.origin_store}
                onValueChange={handleStoreChange("origin_store")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id}
                      disabled={store.id === formData.dest_store}
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Destino">
              <Select
                value={formData.dest_store}
                onValueChange={handleStoreChange("dest_store")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id}
                      disabled={store.id === formData.origin_store}
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="flex gap-4 mt-4">
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
                          <Loader
                            size={16}
                            className="m-4 mx-auto animate-spin"
                          />
                        ) : !productsData?.Items?.length ? (
                          <CommandEmpty>...</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {productsData.Items.map((product) => (
                              <CommandItem
                                key={product.Id}
                                value={titleCase(product.Nombre.toLowerCase())}
                                onSelect={() => {
                                  handleProductSelect(product);
                                }}
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
                      </CommandList>{" "}
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

          <ProductList
            products={formData.products}
            onRemove={handleRemoveProduct}
          />
        </CardContent>
        <CardFooter className="flex justify-between mt-4">
          <Button type="button" variant="link" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && <p className="text-sm text-red-500 px-6 pb-4">{error}</p>}
      </form>
    </Card>
  );
}
