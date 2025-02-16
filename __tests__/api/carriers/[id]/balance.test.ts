import { createMocks } from "node-mocks-http";
import balanceHandler from "@/pages/api/carriers/[id]/balance";
import { supabase } from "@/lib/supabase";
import { Database } from "@/supabase/types/supabase";

type DeliveryTypeEnum = Database["public"]["Enums"]["delivery_type"];

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe("Carrier Balance API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 405 for non-GET requests", async () => {
    const { req, res } = createMocks({
      method: "POST",
    });

    await balanceHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it("returns 400 for missing carrier ID", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });

    await balanceHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "Required" });
  });

  it("returns carrier balance data successfully", async () => {
    const mockCarrier = { id: 1, name: "Test Carrier" };
    const mockInitialBalance = 1000;
    const mockOperations = [
      {
        id: 1,
        operation_date: "2024-01-15",
        cost: 500,
        operation_type: "delivery",
        deliveries: {
          id: 1,
          invoice_number: "INV001",
          type: "home_delivery" as DeliveryTypeEnum,
          customers: { name: "Test Customer" },
          suppliers: null,
        },
      },
    ];
    const mockPayments = [
      {
        payment_date: "2024-01-16",
        payment_method: "cash",
        amount: 300,
        notes: "test payment",
      },
    ];

    // Mock supabase responses
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "carriers") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue({ data: mockCarrier, error: null }),
        };
      } else if (table === "delivery_operations") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest
            .fn()
            .mockResolvedValue({ data: mockOperations, error: null }),
        };
      } else if (table === "carrier_payments") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest
            .fn()
            .mockResolvedValue({ data: mockPayments, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
    });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: mockInitialBalance,
      error: null,
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {
        id: "1",
      },
    });

    await balanceHandler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const responseData = JSON.parse(res._getData());
    expect(responseData).toMatchObject({
      carrier: mockCarrier,
      initialBalance: mockInitialBalance,
      transactions: expect.arrayContaining([
        expect.objectContaining({
          date: mockOperations[0].operation_date,
          concept: expect.stringContaining("INV001"),
          debit: mockOperations[0].cost,
          credit: 0,
          type: "delivery",
          delivery_id: mockOperations[0].deliveries.id,
          delivery_type: mockOperations[0].deliveries.type,
          balance: expect.any(Number),
        }),
        expect.objectContaining({
          date: mockPayments[0].payment_date,
          concept: expect.stringContaining("Pago"),
          debit: 0,
          credit: mockPayments[0].amount,
          type: "payment",
          balance: expect.any(Number),
        }),
      ]),
      totalBalance: expect.any(Number),
    });
  });

  it("handles supabase error", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        error: new Error("Database error"),
      }),
    }));

    const { req, res } = createMocks({
      method: "GET",
      query: {
        id: "1",
      },
    });

    await balanceHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty("error");
  });
});
