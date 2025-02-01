import { createDeliveryService } from "@/services/deliveries";
import { Delivery, DeliveryState, DeliveryType } from "@/types/types";
import { createInventoryMovement } from "@/lib/api";

// Mock external dependencies
jest.mock("@/lib/api", () => ({
  createInventoryMovement: jest.fn(),
}));

jest.mock("@/lib/utils/resend", () => ({
  scheduleFollowUpEmail: jest.fn(),
}));

jest.mock("@/lib/utils/email", () => ({
  triggerEmail: jest.fn(),
}));

describe("Delivery Service", () => {
  // Create a more accurate Supabase query builder mock
  const createQueryBuilder = (initialValue = null, error = null) => {
    const builder: any = {
      data: null,
      error: null,
    };

    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "gt",
      "gte",
      "lte",
      "is",
      "in",
      "not",
      "range",
      "order",
      "single",
      "or",
    ];

    methods.forEach((method) => {
      builder[method] = jest.fn().mockImplementation(() => builder);
    });

    builder.then = jest.fn().mockImplementation((callback) => {
      if (error) {
        return Promise.resolve(callback({ data: null, error }));
      }
      return Promise.resolve(callback({ data: initialValue, error: null }));
    });

    return builder;
  };

  // Mock Supabase client
  let mockQueryBuilder: any;
  const mockSupabase = {
    from: jest.fn().mockImplementation(() => {
      mockQueryBuilder = createQueryBuilder();
      return mockQueryBuilder;
    }),
    rpc: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: null, error: null })),
  };

  const deliveryService = createDeliveryService(mockSupabase as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateItems", () => {
    it("should validate items successfully", async () => {
      const mockDeliveryItems = [
        { product_sku: "SKU1", pending_quantity: 2 },
        { product_sku: "SKU2", pending_quantity: 3 },
      ];

      mockQueryBuilder = createQueryBuilder(mockDeliveryItems);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(
        deliveryService.validateItems(1, [
          { product_sku: "SKU1", quantity: 1, store_id: "store1" },
        ])
      ).resolves.not.toThrow();
    });

    it("should throw error for missing store_id", async () => {
      mockQueryBuilder = createQueryBuilder([
        { product_sku: "SKU1", pending_quantity: 2 },
      ]);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(
        deliveryService.validateItems(1, [
          { product_sku: "SKU1", quantity: 1, store_id: "" },
        ])
      ).rejects.toThrow("Store ID is required");
    });

    it("should throw error for invalid quantity", async () => {
      mockQueryBuilder = createQueryBuilder([
        { product_sku: "SKU1", pending_quantity: 1 },
      ]);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(
        deliveryService.validateItems(1, [
          { product_sku: "SKU1", quantity: 2, store_id: "store1" },
        ])
      ).rejects.toThrow("Invalid quantity");
    });
  });

  describe("processItems", () => {
    const mockItems = [
      { product_sku: "SKU1", quantity: 1, store_id: "store1" },
    ];

    it("should process items and return true when all items are delivered", async () => {
      // Mock insert operation items
      mockSupabase.from.mockImplementationOnce(() => createQueryBuilder(null));

      // Mock successful RPC call
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      // Mock no remaining items
      mockSupabase.from.mockImplementationOnce(() => createQueryBuilder([]));

      const result = await deliveryService.processItems({
        operationId: 1,
        deliveryId: 1,
        items: mockItems,
      });

      expect(result).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      // Mock error on insert
      mockSupabase.from.mockImplementationOnce(() =>
        createQueryBuilder(null, new Error("Database error"))
      );

      await expect(
        deliveryService.processItems({
          operationId: 1,
          deliveryId: 1,
          items: mockItems,
        })
      ).rejects.toThrow("Error creating operation items");
    });
  });

  describe("recordOperation", () => {
    const mockDelivery: Delivery = {
      id: 1,
      order_date: "2024-02-01",
      customer_id: 1,
      state: "pending" as DeliveryState,
      scheduled_date: null,
      created_at: "2024-02-01",
      created_by: null,
      customers: null,
      type: "home_delivery",
      invoice_number: null,
      invoice_id: null,
      supplier_id: null,
      suppliers: null,
      origin_store: null,
      dest_store: null,
      products: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(deliveryService, "getDelivery")
        .mockResolvedValue(mockDelivery);
    });

    it("should create delivery operation with carrier", async () => {
      mockQueryBuilder = createQueryBuilder({ id: 1 });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await deliveryService.recordOperation({
        deliveryId: 1,
        userId: "user1",
        operationType: "delivery",
        carrierId: 1,
        deliveryCost: 1000,
      });

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          delivery_id: 1,
          carrier_id: 1,
          cost: 1000,
        })
      );
    });
  });

  describe("listDeliveries", () => {
    it("should list deliveries with proper filters", async () => {
      const mockResult = {
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        count: 2,
      };

      mockQueryBuilder = createQueryBuilder(mockResult.data);
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((callback) =>
          Promise.resolve(callback(mockResult))
        );
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await deliveryService.listDeliveries({
        state: "pending",
        page: 1,
        pageSize: 10,
        userRole: "admin",
      });

      expect(result).toEqual({
        data: mockResult.data,
        count: mockResult.count,
      });
    });

    it("should handle search filters", async () => {
      const mockCustomers = [{ id: 1 }];
      jest
        .spyOn(deliveryService, "searchCustomers")
        .mockResolvedValueOnce(mockCustomers);

      mockQueryBuilder = createQueryBuilder([{ id: 1 }]);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await deliveryService.listDeliveries({
        state: "pending",
        page: 1,
        pageSize: 10,
        search: "test",
      });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith(
        "customer_id",
        mockCustomers.map((c) => c.id)
      );
    });
  });

  describe("handleNotifications", () => {
    const mockDelivery: Delivery = {
      id: 1,
      order_date: "2025-02-01",
      customer_id: 1,
      state: "delivered",
      scheduled_date: null,
      created_at: "2025-02-01T12:00:00Z",
      type: "home_delivery",
      invoice_number: null,
      invoice_id: null,
      supplier_id: null,
      suppliers: null,
      origin_store: null,
      dest_store: null,
      created_by: {
        id: "user1",
        email: "sales@example.com",
        name: "Sales Person",
      },
      customers: {
        name: "Customer Name",
        address: "123 Main St",
        phone: "1234567890",
        email: "customer@example.com",
      },
      products: [{ name: "Colchon Gani King" }],
    };

    it("should send all relevant notifications", async () => {
      const { scheduleFollowUpEmail } = require("@/lib/utils/resend");
      const { triggerEmail } = require("@/lib/utils/email");

      await deliveryService.handleNotifications(mockDelivery);

      expect(scheduleFollowUpEmail).toHaveBeenCalledWith({
        salesPersonEmail: "sales@example.com",
        salesPersonName: "Sales Person",
        customerName: "Customer Name",
        customerPhone: "1234567890",
      });

      expect(triggerEmail).toHaveBeenCalledWith(
        "customer@example.com",
        "gani_warranty"
      );
      expect(triggerEmail).toHaveBeenCalledWith(
        "customer@example.com",
        "review_request"
      );
    });
  });
});
