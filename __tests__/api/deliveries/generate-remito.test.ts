import handler from "@/pages/api/deliveries/generate-remito";
import { createMocks } from "node-mocks-http";
import PDFDocument from "pdfkit";

// Mock PDFKit
jest.mock("pdfkit");

// Mock path module
jest.mock("path", () => ({
  join: jest.fn(() => "/mocked/path/to/logo.jpg"),
}));

// Mock Supabase client
jest.mock("@/lib/utils/supabase/api", () => {
  return jest.fn().mockImplementation(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  }));
});

describe("/api/deliveries/generate-remito", () => {
  const mockDelivery = {
    id: 123,
    scheduled_date: "2024-02-03",
    products: [
      {
        name: "Sommier King 200x200",
        quantity: 1,
        sku: "KING200",
      },
    ],
  };

  const mockCustomer = {
    id: "456",
    name: "John Doe",
    phone: "3541123456",
    address: "123 Main St",
    dni: "12345678",
  };

  let mockPipe: jest.Mock;
  let mockEnd: jest.Mock;
  let mockText: jest.Mock;
  let mockImage: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup PDFKit mock methods
    mockPipe = jest.fn();
    mockEnd = jest.fn();
    mockText = jest.fn().mockReturnThis();
    mockImage = jest.fn().mockReturnThis();

    (PDFDocument as unknown as jest.Mock).mockImplementation(() => ({
      pipe: mockPipe,
      end: mockEnd,
      text: mockText,
      image: mockImage,
      font: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      fillAndStroke: jest.fn().mockReturnThis(),
      roundedRect: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      lineWidth: jest.fn().mockReturnThis(),
      widthOfString: jest.fn().mockReturnValue(100),
    }));
  });

  describe("HTTP method validation", () => {
    it("should return 405 for non-POST requests", async () => {
      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Method not allowed",
      });
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Override the default mock to return an error
      jest
        .requireMock("@/lib/utils/supabase/api")
        .mockImplementationOnce(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: "Unauthorized" },
            }),
          },
        }));

      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Unauthorized",
      });
    });
  });

  describe("Input validation", () => {
    it("should return 400 for missing delivery data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Invalid delivery or customer data",
      });
    });

    it("should return 400 for missing customer data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Invalid delivery or customer data",
      });
    });

    it("should return 400 for invalid delivery structure", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: { ...mockDelivery, products: "invalid" },
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Invalid delivery or customer data",
      });
    });
  });

  describe("PDF generation", () => {
    it("should generate PDF with correct headers", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res.getHeader("Content-Type")).toBe("application/pdf");
      expect(res.getHeader("Content-Disposition")).toBe(
        `attachment; filename=remito-${mockDelivery.id}.pdf`
      );
    });

    it("should include customer information in the PDF", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      // Verify customer information was included
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining(mockCustomer.name),
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining(mockCustomer.phone),
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining(mockCustomer.address),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should handle missing logo gracefully", async () => {
      mockImage.mockImplementationOnce(() => {
        throw new Error("Logo not found");
      });

      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockText).toHaveBeenCalledWith(
        "ROHI Sommiers",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should handle PDF generation errors", async () => {
      (PDFDocument as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error("PDF generation failed");
      });

      const { req, res } = createMocks({
        method: "POST",
        body: {
          delivery: mockDelivery,
          customer: mockCustomer,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Error generating PDF",
      });
    });
  });
});
