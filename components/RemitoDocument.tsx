import React from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Card } from "@/components/ui/card";

const PrintableRemitoDocument = ({ delivery, customer }) => {
  const getCity = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
  };

  const products = delivery.products ? JSON.parse(delivery.products) : [];

  return (
    <div className="p-4">
      <div className="print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            margin: 0;
          }
          .print-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .document {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .table-section {
            flex: 1;
            max-height: 40vh;
            overflow: hidden;
          }
        }
      `}</style>
      
      <Card className="print-content mt-4 w-full max-w-4xl mx-auto bg-white">
        <div className="document p-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="w-24">
              <img 
                src="https://acdn.mitiendanube.com/stores/001/859/787/themes/common/logo-660750429-1715294136-be2af91d243cfa5a394d0bb1f71d8f6d1715294137-320-0.webp" 
                alt="ROHI Sommiers" 
                className="w-full"
              />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">R</div>
              <div className="text-xs font-semibold">Remito Original</div>
              <div className="text-xs">Nº: {String(delivery.id).padStart(7, '0')}</div>
              <div className="text-xs">Fecha: {new Date(delivery.scheduled_date).toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
            <div>
              <div className="font-semibold">CARINA ANALIA MALAMUD</div>
              <div>AV CORDOBA 937</div>
              <div>VILLA CARLOS PAZ, Cordoba</div>
              <div>Tel.: 3541-623834</div>
              <div>Responsable Inscripto</div>
            </div>
            <div className="text-right">
              <div>CUIT: 27239522942</div>
              <div>Ingresos brutos: 218112447</div>
              <div>Inicio de actividades: 01/11/2018</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-100 p-2 mt-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div>Razón social: {customer.name}</div>
                <div>Domicilio: {customer.address}</div>
                <div>Tel: {customer.phone}</div>
                <div>Ubicación: {getCity(customer.address)}</div>
              </div>
              <div className="text-right">
                <div>DNI: {customer.id}</div>
                <div>Condición de IVA: Consumidor final</div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="table-section mt-2">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-white text-xs">
                  <th className="p-1 text-left w-16">Cantidad</th>
                  <th className="p-1 text-left w-28">Código</th>
                  <th className="p-1 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {products.map((product, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1">{product.quantity}</td>
                    <td className="p-1">{product.sku}</td>
                    <td className="p-1">{product.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-2">
            <div className="text-xs">
              <div>Cantidad total: {products.reduce((sum, p) => sum + p.quantity, 0)}</div>
              <div>VPS: $ 0,00. Transporte:</div>
            </div>

            <div className="text-[10px] mt-2 leading-tight">
              REVISE SU UNIDAD. NO SE RECIBEN RECLAMOS POR RAYADURAS O GOLPES OCASIONADOS EN EL
              TRANSPORTE. Esta merc. goza de gtia. Recuerde que cuenta con 10 días corridos desde la entrega de
              su producto para revocar su aceptación. Al recibir la mercadería, acepta nuestros términos
              y condiciones.
            </div>

            <div className="text-right mt-4">
              <div className="text-xs">Recibí conforme_________________________</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrintableRemitoDocument;