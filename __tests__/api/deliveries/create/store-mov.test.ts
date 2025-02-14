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

    // Setup mock chain methods
    Object.entries(mockSupabaseChain).forEach(([key, value]) => {
      mockSupabaseAuth[key] = value;
    });

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Default delivery creation response
    const mockDeliveryChain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1, type: "store_movement" },
        error: null,
      }),
    };
    mockSupabaseAuth.insert.mockReturnValue(mockDeliveryChain);

    // Default delivery items creation response
    mockCreateDeliveryItems.mockResolvedValue(undefined);
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
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery",
      });
    });

    it("should handle delivery items creation errors", async () => {
      // Mock successful delivery creation
      const mockDeliveryChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1 },
          error: null,
        }),
      };
      mockSupabaseAuth.insert.mockReturnValue(mockDeliveryChain);

      // Mock delivery items creation error
      mockCreateDeliveryItems.mockRejectedValueOnce(
        new Error("Failed to create delivery items")
      );

      const { req, res } = createMocks({
        method: "POST",
        body: validMovementRequest,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to create delivery items",
      });
    });
  });
});
