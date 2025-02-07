import { createMocks } from "node-mocks-http";
import balanceHandler from "@/pages/api/carriers/[id]/balance";
import { supabase } from "@/lib/supabase";

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

  it("returns 400 for invalid carrier ID", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        id: [],
      },
    });

    await balanceHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "Invalid carrier ID" });
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
          type: "delivery",
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

    // Mock supabase responses with proper Promise handling
    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(),
    }));

    // Set up specific mock responses for each table
    const fromMock = supabase.from as jest.Mock;

    fromMock.mockImplementation((table) => {
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
          debit: mockOperations[0].cost,
        }),
        expect.objectContaining({
          date: mockPayments[0].payment_date,
          credit: mockPayments[0].amount,
        }),
      ]),
    });
  }, 10000); // Increase timeout to 10 seconds

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
