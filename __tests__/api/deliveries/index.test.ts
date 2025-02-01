import handler from "@/pages/api/deliveries";
import { DeliveryState } from "@/types/types";
import { createMocks } from "node-mocks-http";

// Mock Supabase client
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: jest.fn(() => mockSupabaseAuth),
}));

// Mock delivery service
const mockListDeliveries = jest.fn();

jest.mock("@/services/deliveries", () => ({
  createDeliveryService: () => ({
    listDeliveries: mockListDeliveries,
  }),
}));

describe("/api/deliveries", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth response
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Default profile response
    mockSupabaseAuth.single.mockResolvedValue({
      data: { role: "sales" },
      error: null,
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Unauthorized"),
      });

      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });

    it("should return 500 if profile fetch fails", async () => {
      mockSupabaseAuth.single.mockResolvedValueOnce({
        data: null,
        error: new Error("Failed to fetch profile"),
      });

      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Failed to fetch user role",
      });
    });
  });

  describe("Method handling", () => {
    it("should return 405 for non-GET requests", async () => {
      const { req, res } = createMocks({
        method: "POST",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Method not allowed",
      });
    });
  });

  describe("Query parameter validation", () => {
    it("should return 400 for invalid state parameter", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { state: "invalid_state" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid state parameter",
      });
    });

    it("should return 400 for invalid scheduledDate parameter", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { scheduledDate: "invalid_date" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid scheduledDate parameter",
      });
    });
  });

  describe("Data fetching", () => {
    const mockDeliveries = [
      {
        id: 1,
        state: "pending" as DeliveryState,
        customer_id: 123,
        scheduled_date: "2024-01-15",
        invoice_number: "FC-001",
      },
      {
        id: 2,
        state: "pending" as DeliveryState,
        customer_id: 124,
        scheduled_date: "2024-01-16",
        invoice_number: "FC-002",
      },
    ];

    it("should return properly formatted delivery data with default parameters", async () => {
      mockListDeliveries.mockResolvedValueOnce({
        data: mockDeliveries,
        count: 2,
      });

      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());

      expect(responseData).toEqual({
        feed: mockDeliveries,
        page: 1,
        totalPages: 1,
        totalItems: 2,
      });

      // Verify service was called with correct default parameters
      expect(mockListDeliveries).toHaveBeenCalledWith({
        state: "pending",
        page: 1,
        pageSize: 40,
        search: "",
        scheduledDate: "all",
        type: "all",
        userId: "test-user-id",
        userRole: "sales",
      });
    });

    it("should handle custom query parameters correctly", async () => {
      mockListDeliveries.mockResolvedValueOnce({
        data: mockDeliveries,
        count: 2,
      });

      const { req, res } = createMocks({
        method: "GET",
        query: {
          state: "delivered",
          page: "2",
          pageSize: "20",
          search: "test",
          scheduledDate: "hasDate",
          type: "home_delivery",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      // Verify service was called with custom parameters
      expect(mockListDeliveries).toHaveBeenCalledWith({
        state: "delivered",
        page: 2,
        pageSize: 20,
        search: "test",
        scheduledDate: "hasDate",
        type: "home_delivery",
        userId: "test-user-id",
        userRole: "sales",
      });
    });

    it("should handle service errors gracefully", async () => {
      mockListDeliveries.mockResolvedValueOnce({
        error: "Database error",
      });

      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Database error",
      });
    });
  });
});
