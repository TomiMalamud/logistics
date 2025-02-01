import handler from "@/pages/api/deliveries/create/pickup";
import { createMocks } from "node-mocks-http";

// Mock Supabase client
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

// Mock delivery service
jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({}),
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

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Default supplier validation response
    mockSupabaseAuth.single.mockResolvedValueOnce({
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
      // Mock successful delivery creation
      mockSupabaseAuth.single
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Supplier validation
        .mockResolvedValueOnce({
          data: { id: 1, type: "supplier_pickup" },
          error: null,
        }); // Delivery creation
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

      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("delivery_items");
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          delivery_id: 1,
          product_sku: "TEST123",
          quantity: 2,
          pending_quantity: 2,
        }),
      ]);
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
    it("should handle delivery creation errors", async () => {
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      }); // Supplier validation

      // Mock the delivery creation to fail
      mockSupabaseAuth.insert.mockImplementationOnce(() => ({
        select: () => ({
          single: () => ({
            data: null,
            error: new Error("Failed to create delivery"),
          }),
        }),
      }));

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
      mockSupabaseAuth.single
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Supplier validation
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }); // Delivery creation

      mockSupabaseAuth.insert
        .mockImplementationOnce(() => mockSupabaseAuth) // First insert (delivery) succeeds
        .mockResolvedValueOnce({
          error: new Error("Failed to create delivery items"),
        }); // Second insert (items) fails

      const { req, res } = createMocks({
        method: "POST",
        body: validPickupRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Error creating delivery items: Failed to create delivery items",
      });
    });
  });
});
