import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

interface InvoiceItem {
  Cantidad: number;
  Codigo: string;
  Concepto: string;
}

interface InvoiceItemsProps {
  invoice_id: number;
  editable?: boolean;
  onSubmit?: (items: InvoiceItem[]) => void;
  initialItems: InvoiceItem[];
}

const TableSkeleton = () => (
  <div className="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cantidad</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Concepto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 2 }).map((_, index) => (
          <TableRow key={index} className="text-left">
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function InvoiceItems({
  editable = false,
  initialItems = [],
  invoice_id,
  onSubmit
}: InvoiceItemsProps): JSX.Element {
  // State for tracking both edited and original items
  const [localItems, setLocalItems] = useState<InvoiceItem[]>(initialItems);
  const [originalItems, setOriginalItems] =
    useState<InvoiceItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  // Update both states when initialItems prop changes
  useEffect(() => {
    setLocalItems(initialItems);
    setOriginalItems(initialItems);
  }, [initialItems]);

  // Fetch items if needed
  useEffect(() => {
    const fetchItems = async () => {
      if (!invoice_id) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/invoices/${invoice_id}`);
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        const items = data.Items || [];
        setLocalItems(items);
        setOriginalItems(items);
      } catch (error) {
        console.error("Error fetching items:", error);
        setLocalItems([]);
        setOriginalItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [invoice_id]);

  const handleQuantityChange = (codigo: string, value: string): void => {
    const quantity = parseFloat(value) || 0;

    setLocalItems((prevItems) =>
      prevItems.map((item) =>
        item.Codigo === codigo ? { ...item, Cantidad: quantity } : item
      )
    );
  };

  const handleRemoveItem = (codigo: string): void => {
    setLocalItems((prevItems) =>
      prevItems.filter((item) => item.Codigo !== codigo)
    );
  };

  // Handle cancel - restore original items
  const handleCancel = () => {
    setLocalItems(originalItems);
    if (onSubmit) {
      onSubmit(originalItems);
    }
  };

  // Handle save - update original items and submit
  const handleSave = () => {
    setOriginalItems(localItems);
    if (onSubmit) {
      onSubmit(localItems);
    }
  };

  const renderTableCell = (item: InvoiceItem) => (
    <TableRow key={item.Codigo} className="text-left h-14">
      <TableCell>
        {editable ? (
          <Input
            type="number"
            value={item.Cantidad}
            className="w-16"
            onChange={(e) => handleQuantityChange(item.Codigo, e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        ) : (
          item.Cantidad
        )}
      </TableCell>
      <TableCell>{item.Codigo}</TableCell>
      <TableCell>{item.Concepto}</TableCell>
      {editable && (
        <TableCell>
          <Button
            variant="ghost"
            onClick={() => handleRemoveItem(item.Codigo)}
            type="button"
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!localItems?.length) {
    return <div>No items to display</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cantidad</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Concepto</TableHead>
            {editable && <TableHead>Eliminar</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>{localItems.map(renderTableCell)}</TableBody>
      </Table>
      {editable && (
        <div className="mt-2 space-x-2 flex items-center justify-end">
          <Button onClick={handleCancel} type="button" variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSave} type="button" variant="default">
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}
