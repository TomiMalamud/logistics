// __tests__/api/inventory/movement.test.ts
import handler from "@/pages/api/inventory/movement";
import { createMocks } from "node-mocks-http";
import * as api from "@/lib/api";

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

// Mock the createInventoryMovement function
jest.mock("@/lib/api", () => ({
  createInventoryMovement: jest.fn(),
}));

describe("Inventory Movement API", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Set default auth response (authenticated user)
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
  });

  describe("Method handling", () => {
    it("should return 405 for non-POST requests", async () => {
      const { req, res } = createMocks({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(res._getHeaders()).toHaveProperty("allow", ["POST"]);
    });
  });

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { req, res } = createMocks({
        method: "POST",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
    });
  });

  describe("Input Validation", () => {
    it("should return 400 when missing required fields", async () => {
      const testCases = [
        {
          body: {},
          expectedError: "Missing required fields",
        },
        {
          body: { origin_store: "60835" },
          expectedError: "Missing required fields",
        },
        {
          body: { origin_store: "60835", dest_store: "24471" },
          expectedError: "Missing required fields",
        },
        {
          body: {
            origin_store: "60835",
            dest_store: "24471",
            product_sku: "SKU123",
          },
          expectedError: "Missing required fields",
        },
      ];

      for (const testCase of testCases) {
        const { req, res } = createMocks({
          method: "POST",
          body: testCase.body,
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: testCase.expectedError,
        });
      }
    });
  });

  describe("Successful Movement Creation", () => {
    it("should create inventory movement successfully", async () => {
      const validMovement = {
        origin_store: "60835",
        dest_store: "24471",
        product_sku: "SKU123",
        quantity: 1,
      };

      const { req, res } = createMocks({
        method: "POST",
        body: validMovement,
      });

      const createInventoryMovement = jest.spyOn(
        api,
        "createInventoryMovement"
      );
      createInventoryMovement.mockResolvedValueOnce(undefined);

      await handler(req, res);

      expect(createInventoryMovement).toHaveBeenCalledWith({
        idDepositoOrigen: validMovement.origin_store,
        idDepositoDestino: validMovement.dest_store,
        codigo: validMovement.product_sku,
        cantidad: validMovement.quantity,
      });

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        message: "Inventory movement created successfully",
      });
    });

    it("should handle ERP API errors gracefully", async () => {
      const validMovement = {
        origin_store: "60835",
        dest_store: "24471",
        product_sku: "SKU123",
        quantity: 1,
      };

      const { req, res } = createMocks({
        method: "POST",
        body: validMovement,
      });

      const createInventoryMovement = jest.spyOn(
        api,
        "createInventoryMovement"
      );
      createInventoryMovement.mockRejectedValueOnce(new Error("ERP API Error"));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "ERP API Error",
      });
    });
  });
});
