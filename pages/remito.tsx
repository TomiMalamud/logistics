import React from 'react';
import PrintableRemitoDocument from '@/components/RemitoDocument';

// Mock data
const mockDelivery = {
  id: 623,
  scheduled_date: "2025-01-10",
  products: JSON.stringify([
    {
      sku: "CUCH.DESM",
      name: "CUCHETA ROHI ECO DESMONTABLE",
      quantity: 1
    },
    {
      sku: "COLCH.140",
      name: "COLCHON ROHI CONFORT 140x190",
      quantity: 2
    }
  ])
};

const mockCustomer = {
  id: "23365738149",
  name: "ALVARO HONORIO FABIAN ARAMAYO",
  address: "LOS ALAMOS 295 - CP 5152, VILLA CARLOS PAZ, Cordoba",
  phone: "3516368861"
};

const RemitoPage = () => {
    return (
      <PrintableRemitoDocument
        delivery={mockDelivery} 
        customer={mockCustomer} 
      />
    );
  };
  
  export default RemitoPage;