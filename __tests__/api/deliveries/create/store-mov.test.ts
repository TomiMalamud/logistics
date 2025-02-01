import handler from "@/pages/api/deliveries/create/store-mov";
import { Store } from "@/types/types";
import { createMocks } from "node-mocks-http";

// Mock constants
jest.mock("@/lib/utils/constants", () => ({
  getStore: (id: string): Store | undefined => {
    const stores: Record<string, Store> = {
      "60835": { id: "60835", label: "CD" },
      "24471": { id: "24471", label: "9 de Julio" },
    };
    return stores[id];
  },
}));

// Mock Supabase client
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

describe("/api/deliveries/create/store-mov", () => {
  const validMovementRequest = {
    origin_store: "60835",
    dest_store: "24471",
    products: [
      {
        name: "Test Mattress",
        sku: "TEST123",
        quantity: 2,
      },
    ],
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

    // Default delivery creation response
    mockSupabaseAuth.insert.mockImplementation(() => ({
      select: () => ({
        single: () => ({
          data: { id: 1, type: "store_movement" },
          error: null,
        }),
      }),
    }));
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
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input validation", () => {
    it("should validate required stores", async () => {
      const invalidRequest = { ...validMovementRequest, origin_store: "" };

      const { req, res } = createMocks({
        method: "POST",
        body: invalidRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Origin and destination stores are required",
      });
    });

    it("should validate products array exists", async () => {
      const invalidRequest = { ...validMovementRequest, products: [] };

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

    it("should validate product format", async () => {
      const invalidRequest = {
        ...validMovementRequest,
        products: [{ invalid: "format" }],
      };

      const { req, res } = createMocks({
        method: "POST",
        body: invalidRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid product format",
      });
    });

    it("should validate store IDs exist", async () => {
      const invalidRequest = {
        ...validMovementRequest,
        origin_store: "invalid-id",
      };

      const { req, res } = createMocks({
        method: "POST",
        body: invalidRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid store IDs",
      });
    });
  });

  describe("Store movement creation", () => {
    it("should create movement with correct data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSupabaseAuth.from).toHaveBeenCalledWith("deliveries");
      expect(mockSupabaseAuth.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          origin_store: validMovementRequest.origin_store,
          dest_store: validMovementRequest.dest_store,
          type: "store_movement",
          state: "pending",
          scheduled_date: validMovementRequest.scheduled_date,
        }),
      ]);
    });

    it("should create delivery items correctly", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: validMovementRequest,
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
      const requestWithoutDate = { ...validMovementRequest };
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
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery",
      });
    });

    it("should handle delivery items creation errors", async () => {
      // First insert (delivery) succeeds
      mockSupabaseAuth.insert
        .mockImplementationOnce(() => ({
          select: () => ({
            single: () => ({
              data: { id: 1 },
              error: null,
            }),
          }),
        }))
        // Second insert (items) fails
        .mockImplementationOnce(() => ({
          error: new Error("Failed to create delivery items"),
        }));

      const { req, res } = createMocks({
        method: "POST",
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Error creating delivery items: Failed to create delivery items",
      });
    });
  });
});
