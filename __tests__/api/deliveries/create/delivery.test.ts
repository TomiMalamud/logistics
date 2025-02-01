import handler from "@/pages/api/deliveries/create/delivery";
import { createMocks } from "node-mocks-http";

// Mock external services
jest.mock("@/lib/perfit", () => ({
  createOrUpdateContact: jest.fn(),
  formatPerfitContact: jest.fn(),
}));

jest.mock("title-case", () => ({
  titleCase: jest.fn((str) => str), // Simple mock that returns the input string
}));

// Mock Supabase client
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

// Mock delivery service
const mockCreateNote = jest.fn();

jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    createNote: mockCreateNote,
  }),
}));

describe("/api/deliveries/create/delivery", () => {
  const validDeliveryRequest = {
    order_date: "2024-01-15",
    products: [
      {
        name: "Test Product",
        sku: "TEST123",
        quantity: 1,
      },
    ],
    invoice_number: "FC-001",
    invoice_id: "123",
    name: "John Doe",
    address: "123 Test St",
    phone: "1234567890",
    dni: "12345678",
    email: "john@example.com",
    store_id: "60835",
    created_by: "test-user-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
  });

  describe("Request method validation", () => {
    it("should return 405 for non-POST requests", async () => {
      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Unauthorized"),
      });

      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input validation", () => {
    it("should validate required fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          order_date: "2024-01-15",
          // Missing required fields
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty("error");
    });

    it("should require either email or email bypass reason", async () => {
      const requestWithoutEmail = { ...validDeliveryRequest };
      delete requestWithoutEmail.email;

      const { req, res } = createMocks({
        method: "POST",
        body: requestWithoutEmail,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Either email or email bypass reason must be provided",
      });
    });
  });

  describe("Customer handling", () => {
    it("should create a new customer if DNI not found", async () => {
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({ data: null });
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("customers");
      expect(mockSupabaseAuth.insert).toHaveBeenCalled();
    });

    it("should update existing customer if DNI found", async () => {
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({
        data: { id: 1 },
      });
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("customers");
      expect(mockSupabaseAuth.update).toHaveBeenCalled();
    });
  });

  describe("Delivery creation", () => {
    beforeEach(() => {
      // Mock successful customer creation/update
      mockSupabaseAuth.maybeSingle.mockResolvedValue({ data: { id: 1 } });
      mockSupabaseAuth.single
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Customer
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }); // Delivery
    });

    it("should create delivery with correct data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("deliveries");
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          order_date: validDeliveryRequest.order_date,
          customer_id: 1,
          state: "pending",
          type: "home_delivery",
        }),
      ]);
    });

    it("should create delivery items", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("delivery_items");
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          delivery_id: 1,
          product_sku: "TEST123",
          quantity: 1,
          pending_quantity: 1,
        }),
      ]);
    });

    it("should create note if provided", async () => {
      const requestWithNote = {
        ...validDeliveryRequest,
        notes: "Test note",
      };

      const { req, res } = createMocks({
        method: "POST",
        body: requestWithNote,
      });

      await handler(req, res);

      expect(mockCreateNote).toHaveBeenCalledWith({
        deliveryId: 1,
        text: "Test note",
      });
    });
  });

  describe("Error handling", () => {
    it("should handle customer creation errors", async () => {
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({ data: null });
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: null,
        error: new Error("Database error"),
      });

      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create customer: Database error",
      });
    });

    it("should handle delivery creation errors", async () => {
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({ data: { id: 1 } });
      mockSupabaseAuth.single
        .mockResolvedValueOnce({ data: { id: 1 }, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Failed to create delivery"),
        });

      const { req, res } = createMocks({
        method: "POST",
        body: validDeliveryRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery",
      });
    });
  });
});
