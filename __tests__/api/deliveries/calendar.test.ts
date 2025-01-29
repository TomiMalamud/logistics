import handler from "@/pages/api/deliveries/calendar";
import { createMocks } from "node-mocks-http";

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
const mockListDeliveries = jest.fn();
const mockListOperations = jest.fn();

jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    listDeliveries: mockListDeliveries,
    listOperations: mockListOperations,
  }),
}));

describe("/api/deliveries/calendar", () => {
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
      mockSupabaseAuth.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { req, res } = createMocks({
        method: "GET",
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input Validation", () => {
    it("should return 400 when dates are missing", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Valid start and end dates are required",
      });
    });

    it("should return 400 when dates are invalid arrays", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { startDate: ["2024-01-01"], endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Valid start and end dates are required",
      });
    });
  });

  describe("Method handling", () => {
    it("should return 405 for unsupported methods", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Method not allowed",
      });
    });
  });

  describe("Data fetching", () => {
    const mockScheduledDeliveries = [
      {
        id: 1,
        scheduled_date: "2024-01-15",
        invoice_id: 123,
        customers: {
          name: "John Doe",
          address: "123 Main St",
          phone: "1234567890",
        },
        created_by: {
          name: "Sales Agent",
        },
        delivery_items: [
          {
            quantity: 1,
            pending_quantity: 1,
            products: {
              name: "Test Product",
            },
          },
        ],
      },
    ];

    const mockOperations = [
      {
        id: 1,
        operation_date: "2024-01-16T00:00:00",
        cost: 1000,
        pickup_store: null,
        carriers: {
          name: "Test Carrier",
        },
        delivery: {
          id: 2,
          type: "home_delivery",
          customers: {
            name: "Jane Doe",
            address: "456 Oak St",
            phone: "0987654321",
          },
        },
        operation_items: [
          {
            quantity: 1,
            products: {
              name: "Delivered Product",
            },
          },
        ],
      },
    ];

    it("should return properly formatted calendar data", async () => {
      mockListDeliveries
        .mockResolvedValueOnce({ data: mockScheduledDeliveries, error: null })
        .mockResolvedValueOnce({ data: [], count: 5 });
      mockListOperations.mockResolvedValue({ data: mockOperations });

      const { req, res } = createMocks({
        method: "GET",
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      // Check response structure
      expect(responseData).toHaveProperty("feed");
      expect(responseData).toHaveProperty("totalItems");
      expect(responseData).toHaveProperty("unscheduledCount");
      expect(responseData).toHaveProperty("dailyCosts");
      expect(responseData).toHaveProperty("totalCost");

      // Verify data transformation
      expect(responseData.feed).toHaveLength(2); // 1 pending + 1 delivered
      expect(responseData.unscheduledCount).toBe(5);
      expect(responseData.totalCost).toBe(1000);

      // Check daily costs
      expect(responseData.dailyCosts["2024-01-16"]).toBe(1000);
    });

    it("should handle empty results correctly", async () => {
      mockListDeliveries
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], count: 0 });
      mockListOperations.mockResolvedValue({ data: [] });

      const { req, res } = createMocks({
        method: "GET",
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData.feed).toHaveLength(0);
      expect(responseData.totalItems).toBe(0);
      expect(responseData.unscheduledCount).toBe(0);
      expect(responseData.totalCost).toBe(0);
      expect(Object.keys(responseData.dailyCosts)).toHaveLength(0);
    });

    it("should handle service errors gracefully", async () => {
      mockListDeliveries.mockRejectedValue(new Error("Database error"));

      const { req, res } = createMocks({
        method: "GET",
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Database error",
      });
    });
  });
});
