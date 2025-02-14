import handler from "@/pages/api/deliveries/create/delivery";
import { createMocks } from "node-mocks-http";

// Mock external services
jest.mock("@/lib/perfit", () => ({
  createOrUpdateContact: jest.fn(),
  formatPerfitContact: jest.fn(),
}));

jest.mock("title-case", () => ({
  titleCase: jest.fn((str) => str),
}));

// Mock delivery service functions
const mockCreateDeliveryItems = jest.fn();
const mockCreateNote = jest.fn();

jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    createDeliveryItems: mockCreateDeliveryItems,
    createNote: mockCreateNote,
  }),
}));

// Mock Supabase client
const mockSupabaseFrom = jest.fn().mockReturnThis();
const mockSupabaseSelect = jest.fn().mockReturnThis();
const mockSupabaseInsert = jest.fn().mockReturnThis();
const mockSupabaseUpdate = jest.fn().mockReturnThis();
const mockSupabaseEq = jest.fn().mockReturnThis();
const mockSupabaseSingle = jest.fn();
const mockSupabaseMaybeSingle = jest.fn();

const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  from: mockSupabaseFrom,
  select: mockSupabaseSelect,
  insert: mockSupabaseInsert,
  update: mockSupabaseUpdate,
  eq: mockSupabaseEq,
  single: mockSupabaseSingle,
  maybeSingle: mockSupabaseMaybeSingle,
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

// At the top of the file, after the mock declarations
const mockSupabaseChain = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

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

    // Reset all mock implementations
    mockSupabaseFrom.mockReturnThis();
    mockSupabaseSelect.mockReturnThis();
    mockSupabaseInsert.mockReturnThis();
    mockSupabaseUpdate.mockReturnThis();
    mockSupabaseEq.mockReturnThis();

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Default customer check response
    mockSupabaseMaybeSingle.mockResolvedValue({ data: null });

    // Default customer creation response
    mockSupabaseSingle.mockResolvedValueOnce({
      data: { id: 1 },
      error: null,
    });

    // Default delivery creation response
    mockSupabaseSingle.mockResolvedValueOnce({
      data: { id: 1 },
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
      expect(mockSupabaseFrom).toHaveBeenCalledWith("deliveries");
      expect(mockSupabaseInsert).toHaveBeenCalledWith([
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

      expect(mockCreateDeliveryItems).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            product_sku: "TEST123",
            quantity: 1,
            name: "Test Product",
          }),
        ])
      );
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
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();

      // Reset auth mock to successful state
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Setup base chain methods
      Object.assign(mockSupabaseAuth, mockSupabaseChain);
    });

    it("should handle customer creation errors", async () => {
      // Mock customer lookup
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({ data: null });

      // Mock customer creation error
      mockSupabaseAuth.from.mockReturnThis();
      mockSupabaseAuth.select.mockReturnThis();
      mockSupabaseAuth.insert.mockReturnThis();
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
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
      // Mock successful customer lookup and creation
      mockSupabaseAuth.maybeSingle.mockResolvedValueOnce({ data: null });
      mockSupabaseAuth.single
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Customer creation success
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Failed to create delivery" },
        }); // Delivery creation error

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
