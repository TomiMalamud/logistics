import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeLabel = ({ product }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, product.sku, {
        format: "CODE39",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0
      });
    }
  }, [product.sku]);

  return (
    <div className="relative border-r border-t border-dashed border-gray-300 p-2" >
      <div className="flex flex-col items-center gap-2">
        <div className="text-center text-sm font-semibold">
          {product.name || '\u00A0'}
        </div>
        <svg ref={barcodeRef} className="h-4 w-48" />
        <div className="text-xs text-gray-600">{product.sku}</div>
      </div>
    </div>
  );
};

const BarcodeGrid = () => {
  const products = `MESA.RAT.JULI, MESA RATONA JULIETA 70X40 40 ALTO
MES.CENTRO.GALI, MESA CENTRO GALIUM 64X64X40
SILL-GALI-1C, SILLON 1 GALIUM 1 CUERPO64X87X45
SILL-GALI-2C, SILLON GALIUM 2 CUERPOS 123X87X45
RACK.TV.NORD, RACK NORDICO TV ROHI ECO 120X60X27
BODEGU80, BODEGUERO ROHI ECO PUERTA 1 CAJÓN
PERCH.ROHI, PERCHERO ROHI ECO 175X60X30 CON CAJONES
ESC40180, ESCOBERO 40X180 ROHI ECO
MEMICH, MESA MEMI CHICA
MEMIGDE, MESA MEMI GRANDE
MESA.LUZ.SOM, MESA DE LUZ SOMMIER 2 CAJ ROHI ECO
MELUZ.ROHI.RETR, MESA DE LUZ ROHI ECO RETRO
USADO.MESATV, MESA DE TV - BASE DE VIDRIO
BIBLIO.CUBOx2, BIBLIOTECA CUBO ROHI ECO X2
EST.ROHI1, ESTANTERIA ROHI ECO 110X60X40
TABU.ECO, TABURETE ROHI ECO REFORZADO
EST.ZAP, ESTANTERIA ZAPATERO ROHI ECO 60X60X30
BAN.ROHI, BANCO ROHI ECO 100X45X30
USADO.ALAC, ALACENA 60X40X30
USADO.BODEG, BODEGUERO (CAVA) P/15 BOTELLAS 70X45X33
EST.ROH, ESTANTERIA ROHI ECO 80X180X40
MESA.RAT.60, MESA RATONA 60X45X40 ALTO ROHI ECO
SILL.INF.ROHI, SILLITA INFANTIL ROHI ECO
PER.2C.BA, PERCHERO CUBO TRES CAJONES + BARRAL 170X50X40
MESA.CUBO120x80, MESA CUBO ROHI ECO 120X80X80
MESA.CUBO.160x80, MESA CUBO ROHI ECO 160X80X80
2022-CON, MESA DE CENTRO 0.90M TB
ESP.FLOR, ESPEJO FLOR ROHI ECO
EST.3E.170X50, ESTANTERIA CON 3 ESTANTES 170X50X40`.split('\n')
    .map(line => {
      const [sku, name] = line.split(',').map(s => s.trim());
      return { sku, name };
    });

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 border-b border-l border-dashed border-gray-300">
        {products.map((product, index) => (
          <BarcodeLabel key={index} product={product} />
        ))}
      </div>
    </div>
  );
};

export default BarcodeGrid;