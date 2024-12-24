import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogClose, DialogFooter } from "./ui/dialog";

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
  onSubmit,
  initialItems = [],
  invoice_id,
}: InvoiceItemsProps): JSX.Element {
  const [localItems, setLocalItems] = useState<InvoiceItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when initialItems prop changes
  useEffect(() => {
    setLocalItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!invoice_id) return;
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/get-invoice?invoice_id=${invoice_id}`);
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        setLocalItems(data.Items || []);
      } catch (error) {
        console.error('Error fetching items:', error);
        setLocalItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [invoice_id]);

  const handleQuantityChange = (codigo: string, value: string): void => {
    const quantity = parseFloat(value);
    
    const updatedItems = localItems.map((item): InvoiceItem =>
      item.Codigo === codigo ? { ...item, Cantidad: quantity } : item
    );
    
    setLocalItems(updatedItems);
  };

  const handleRemoveItem = (codigo: string): void => {
    const updatedItems = localItems.filter((item) => item.Codigo !== codigo);
    setLocalItems(updatedItems);
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
    </div>
  );
}