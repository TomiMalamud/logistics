import handler from "@/pages/api/deliveries/[id]";
import { createMocks } from "node-mocks-http";
import { Database } from "@/supabase/types/supabase";

type DeliveryStateEnum = Database["public"]["Enums"]["delivery_state"];
type StoreEnum = Database["public"]["Enums"]["store"];

// Mock dependencies
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

// Mock delivery service functions
const mockGetDelivery = jest.fn();
const mockValidateItems = jest.fn();
const mockRecordOperation = jest.fn();
const mockUpdateDelivery = jest.fn();
const mockHandleNotifications = jest.fn();

jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    getDelivery: mockGetDelivery,
    validateItems: mockValidateItems,
    recordOperation: mockRecordOperation,
    updateDelivery: mockUpdateDelivery,
    handleNotifications: mockHandleNotifications,
  }),
}));

describe("/api/deliveries/[id]", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Set default auth response (authenticated user)
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Mock unauthenticated user for this test
      mockSupabaseAuth.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { req, res } = createMocks({
        method: "GET",
        query: { id: "1" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input Validation", () => {
    it("should return 400 for non-numeric delivery ID", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { id: "invalid" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid delivery ID",
      });
    });
  });

  describe("GET requests", () => {
    it("should return delivery data for valid ID", async () => {
      const mockDelivery = {
        id: 1,
        state: "pending" as DeliveryStateEnum,
        customer_id: 123,
      };

      mockGetDelivery.mockResolvedValue(mockDelivery);

      const { req, res } = createMocks({
        method: "GET",
        query: { id: "1" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockDelivery);
    });

    it("should return 404 when delivery is not found", async () => {
      mockGetDelivery.mockRejectedValue(new Error("Delivery not found"));

      const { req, res } = createMocks({
        method: "GET",
        query: { id: "1" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Delivery not found",
      });
    });
  });

  describe("PUT requests", () => {
    const validStore = "60835" as StoreEnum;

    const validItems = [
      {
        product_sku: "SKU1",
        quantity: 1,
        store_id: "60835" as StoreEnum,
      },
    ];

    it("should update delivery state from pending to delivered with carrier", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "pending" as DeliveryStateEnum,
      });

      mockRecordOperation.mockResolvedValue({ allItemsDelivered: true });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          carrier_id: 1,
          delivery_cost: 1000,
          items: validItems,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateDelivery).toHaveBeenCalledWith({
        id: 1,
        state: "delivered",
        scheduledDate: undefined,
      });
      expect(mockHandleNotifications).toHaveBeenCalled();
    });

    it("should update delivery state from pending to delivered with pickup store", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "pending" as DeliveryStateEnum,
      });

      mockRecordOperation.mockResolvedValue({ allItemsDelivered: true });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          pickup_store: validStore,
          items: validItems,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateDelivery).toHaveBeenCalledWith({
        id: 1,
        state: "delivered",
        scheduledDate: undefined,
      });
      expect(mockHandleNotifications).toHaveBeenCalled();
    });

    it("should handle partial delivery correctly", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "pending" as DeliveryStateEnum,
      });

      mockRecordOperation.mockResolvedValue({ allItemsDelivered: false });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          carrier_id: 1,
          delivery_cost: 1000,
          items: validItems,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateDelivery).toHaveBeenCalledWith({
        id: 1,
        state: "pending",
        scheduledDate: undefined,
      });
      expect(mockHandleNotifications).not.toHaveBeenCalled();
    });

    it("should validate delivery operation parameters", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "pending" as DeliveryStateEnum,
      });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          state: "delivered",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Either provide a pickup store or carrier for delivery",
        details: [
          {
            code: "custom",
            message: "Either provide a pickup store or carrier for delivery",
            path: [],
          },
        ],
      });
    });

    it("should require delivery cost when carrier is provided", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "pending" as DeliveryStateEnum,
      });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          state: "delivered",
          carrier_id: 1,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Delivery cost is required when carrier is provided",
        details: [
          {
            code: "custom",
            message: "Delivery cost is required when carrier is provided",
            path: [],
          },
        ],
      });
    });

    it("should prevent invalid state transitions", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "delivered" as DeliveryStateEnum,
      });

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          state: "pending",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid state transition",
        details: "State can only be changed to cancelled",
      });
    });

    it("should allow cancellation from any state", async () => {
      mockGetDelivery.mockResolvedValue({
        id: 1,
        state: "delivered" as DeliveryStateEnum,
      });

      mockRecordOperation.mockResolvedValue(true);

      const { req, res } = createMocks({
        method: "PUT",
        query: { id: "1" },
        body: {
          state: "cancelled",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateDelivery).toHaveBeenCalledWith({
        id: 1,
        state: "cancelled",
        scheduledDate: undefined,
      });
    });
  });

  describe("Method handling", () => {
    it("should return 405 for unsupported methods", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { id: "1" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});
