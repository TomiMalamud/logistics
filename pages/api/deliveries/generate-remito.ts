// pages/api/deliveries/generate-remito.ts
import { formatDate } from "@/lib/utils/format";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import PDFDocument from "pdfkit";

// Types
interface Product {
  name: string;
  quantity: number;
  sku?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  dni?: string; // Added optional DNI field
}

interface Delivery {
  id: number;
  scheduled_date: string;
  products: Product[];
}

// Helper functions
const addHeaderImage = (doc: PDFKit.PDFDocument, margin: number): boolean => {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    doc.image(logoPath, margin, margin, {
      fit: [100, 60],
      align: "center",
    });
    return true;
  } catch (error) {
    console.error("Logo not found, using text fallback");
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("ROHI Sommiers", margin, margin + 20);
    return false;
  }
};

const rightAlignedText = (
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number
) => {
  const textWidth = doc.widthOfString(text);
  doc.text(text, x - textWidth, y);
};

const validateDeliveryData = (
  delivery: Partial<Delivery>,
  customer: Partial<Customer>
): boolean => {
  if (
    !delivery?.id ||
    !delivery.scheduled_date ||
    !Array.isArray(delivery.products)
  ) {
    return false;
  }

  if (!customer?.name || !customer.address || !customer.phone) {
    return false;
  }

  return true;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { delivery, customer } = req.body;

    // Validate input data
    if (!validateDeliveryData(delivery, customer)) {
      return res
        .status(400)
        .json({ message: "Invalid delivery or customer data" });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=remito-${delivery.id}.pdf`
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Layout constants
    const margin = 40;
    const pageWidth = 595.28; // A4 width in points
    const contentWidth = pageWidth - margin * 2;
    const rightColumnX = pageWidth - margin - 10;

    // Add header image or fallback text
    const hasLogo = addHeaderImage(doc, margin);

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("R", (pageWidth - doc.widthOfString("R")) / 2, margin + 10);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Cod. 91",
        (pageWidth - doc.widthOfString("Cod. 91")) / 2,
        margin + 35
      );

    // Header - Document Info
    doc.font("Helvetica");
    rightAlignedText(doc, "Remito Original", pageWidth - margin, margin + 25);
    rightAlignedText(
      doc,
      `Nro.: 0006-${String(delivery.id).padStart(8, "0")}`,
      pageWidth - margin,
      margin + 40
    );

    rightAlignedText(
      doc,
      `Fecha: ${formatDate(delivery.scheduled_date)}`,
      pageWidth - margin,
      margin + 55
    );

    // Company Information - Left Column
    doc
      .font("Helvetica-Bold")
      .text("CARINA ANALIA MALAMUD", margin, margin + 80)
      .font("Helvetica")
      .text("AV CORDOBA 937", margin, margin + 95)
      .text("VILLA CARLOS PAZ, Cordoba", margin, margin + 110)
      .text("Tel.: 3541-623834", margin, margin + 125)
      .text("Responsable Inscripto", margin, margin + 140);

    // Company Information - Right Column
    doc.font("Helvetica");
    rightAlignedText(doc, "CUIT: 27239522942", pageWidth - margin, margin + 80);
    rightAlignedText(
      doc,
      "Ingresos brutos: 218112447",
      pageWidth - margin,
      margin + 95
    );
    rightAlignedText(
      doc,
      "Inicio de actividades: 01/11/2018",
      pageWidth - margin,
      margin + 110
    );

    // Customer Information Box
    const customerBoxY = margin + 170;
    doc
      .roundedRect(margin, customerBoxY, contentWidth, 95, 5)
      .fillAndStroke("#f6f6f6", "#f6f6f6");

    // Customer Information
    doc
      .fillColor("#000000")
      .fontSize(12)
      .font("Helvetica")
      .text(`Razón social: ${customer.name}`, margin + 10, customerBoxY + 15)
      .text(`Tel: ${customer.phone}`, margin + 10, customerBoxY + 35);

    // Add DNI if available
    if (customer.dni) {
      const idType = customer.dni.length === 8 ? "DNI: " : "CUIT: ";
      doc.text(`${idType}${customer.dni}`, margin + 300, customerBoxY + 15);
    }

    doc
      .text(`Domicilio: ${customer.address}`, margin + 10, customerBoxY + 55)
      .text(
        "Condición de IVA: Consumidor final",
        margin + 10,
        customerBoxY + 75
      );

    // Customer Information - Right Side
    rightAlignedText(doc, "", rightColumnX, customerBoxY + 35);

    // Products Table
    const tableTop = customerBoxY + 110;
    const tableHeaderHeight = 25;
    const rowHeight = 25;

    // Table Header
    doc
      .moveTo(margin, tableTop + tableHeaderHeight)
      .lineTo(margin + contentWidth, tableTop + tableHeaderHeight)
      .lineWidth(1)
      .stroke("#333");

    // Table Header Text
    doc
      .fillColor("#000")
      .fontSize(10)
      .text("Cantidad", margin + 10, tableTop + 7)
      .text("Código", margin + 80, tableTop + 7)
      .text("Descripción", margin + 190, tableTop + 7);

    // Table Content
    let y = tableTop + tableHeaderHeight;
    delivery.products.forEach((product: Product, index: number) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(String(product.quantity), margin + 10, y + 10)
        .text(product.sku || "", margin + 80, y + 10)
        .text(product.name, margin + 190, y + 10);

      if (index < delivery.products.length - 1) {
        doc
          .moveTo(margin, y + rowHeight)
          .lineTo(margin + contentWidth, y + rowHeight)
          .lineWidth(0.5)
          .stroke("#e5e5e5");
      }

      y += rowHeight;
    });

    // Footer Section
    const footerY = 700;

    // Totals
    const totalQuantity = delivery.products.reduce(
      (sum: number, p: Product) => sum + p.quantity,
      0
    );
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Cantidad total: ${totalQuantity}`, margin, footerY);

    // Disclaimer
    doc
      .fontSize(8)
      .text(
        "REVISE SU UNIDAD. NO SE RECIBEN RECLAMOS POR RAYADURAS O GOLPES OCASIONADOS EN EL TRANSPORTE. " +
          "Esta merc. goza de gtia. Recuerde que cuenta con 10 días corridos desde la entrega de su producto " +
          "para revocar su aceptación. Al recibir la mercadería, acepta nuestros términos y condiciones.",
        margin,
        footerY + 20,
        {
          width: contentWidth,
          align: "left",
        }
      );

    // Signature Line
    doc
      .fontSize(10)
      .text("Recibí conforme_________________________", margin, footerY + 90, {
        width: contentWidth,
        align: "right",
      });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
}
