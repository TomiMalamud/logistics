import handler from "@/pages/api/deliveries/create/pickup";
import { createMocks } from "node-mocks-http";

// Mock delivery service
const mockCreateDeliveryItems = jest.fn();
jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    createDeliveryItems: mockCreateDeliveryItems,
  }),
}));

// Mock Supabase client
const mockSupabaseChain = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  ...mockSupabaseChain,
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

describe("/api/deliveries/create/pickup", () => {
  const validPickupRequest = {
    products: [
      {
        sku: "TEST123",
        quantity: 2,
      },
    ],
    supplier_id: 1,
    scheduled_date: "2024-01-15",
    created_by: "test-user-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain methods
    Object.entries(mockSupabaseChain).forEach(([key, value]) => {
      mockSupabaseAuth[key] = value;
    });

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Default supplier validation response
    mockSupabaseAuth.single
      .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Supplier check
      .mockResolvedValueOnce({ data: { id: 1 }, error: null }); // Delivery creation
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
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input validation", () => {
    it("should validate required products array", async () => {
      const invalidRequest = { ...validPickupRequest, products: [] };

      const { req, res } = createMocks({
        method: "POST",
        body: invalidRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Products array is required and cannot be empty",
      });
    });

    it("should validate supplier_id is present", async () => {
      const invalidRequest = { ...validPickupRequest };
      delete invalidRequest.supplier_id;

      const { req, res } = createMocks({
        method: "POST",
        body: invalidRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Supplier ID is required",
      });
    });

    it("should validate supplier exists", async () => {
      mockSupabaseAuth.single.mockReset();
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: null,
        error: new Error("Supplier not found"),
      });

      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid supplier",
      });
    });
  });

  describe("Pickup delivery creation", () => {
    beforeEach(() => {
      mockCreateDeliveryItems.mockResolvedValue(undefined);
    });

    it("should create pickup delivery with correct data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("deliveries");
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          supplier_id: validPickupRequest.supplier_id,
          scheduled_date: validPickupRequest.scheduled_date,
          created_by: validPickupRequest.created_by,
          type: "supplier_pickup",
          state: "pending",
        }),
      ]);
    });

    it("should create delivery items correctly", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(mockCreateDeliveryItems).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            product_sku: "TEST123",
            quantity: 2,
          }),
        ])
      );
    });

    it("should handle optional scheduled_date", async () => {
      const requestWithoutDate = { ...validPickupRequest };
      delete requestWithoutDate.scheduled_date;

      const { req, res } = createMocks({
        method: "POST",
        body: requestWithoutDate,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          scheduled_date: null,
        }),
      ]);
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
      Object.entries(mockSupabaseChain).forEach(([key, value]) => {
        mockSupabaseAuth[key] = value;
      });
    });

    it("should handle delivery creation errors", async () => {
      // Mock supplier check success
      mockSupabaseAuth.from.mockReturnThis();
      mockSupabaseAuth.select.mockReturnThis();
      mockSupabaseAuth.eq.mockReturnThis();
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      }); // Supplier check

      // Mock delivery creation failure
      const mockDeliveryChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Failed to create delivery" },
        }),
      };
      mockSupabaseAuth.insert.mockReturnValue(mockDeliveryChain);

      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery",
      });
    });

    it("should handle delivery items creation errors", async () => {
      // Mock supplier check success
      mockSupabaseAuth.from.mockReturnThis();
      mockSupabaseAuth.select.mockReturnThis();
      mockSupabaseAuth.eq.mockReturnThis();
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      }); // Supplier check

      // Mock successful delivery creation
      const mockDeliveryChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      };
      mockSupabaseAuth.insert.mockReturnValue(mockDeliveryChain);

      // Mock delivery items creation error
      mockCreateDeliveryItems.mockRejectedValueOnce(
        new Error("Failed to create delivery items")
      );

      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery items",
      });
    });
  });
});
