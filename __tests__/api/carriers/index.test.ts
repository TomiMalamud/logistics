import { mockSupabase } from "../../utils";

// Mock the createClient function from @/lib/utils/supabase/api
const mockCreateClient = jest.fn(() => mockSupabase);
jest.mock("@/lib/utils/supabase/api", () => ({
  __esModule: true,
  default: mockCreateClient,
}));

import handler from "@/pages/api/carriers";
import { mockRequestResponse } from "../../utils";

describe("Carriers API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.reset();
  });

  it("returns 405 for non-GET requests", async () => {
    const { req, res } = mockRequestResponse("POST");
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it("successfully fetches carriers", async () => {
    const mockCarriers = [
      { id: 1, name: "Carrier 1" },
      { id: 2, name: "Carrier 2" },
    ];

    // Setup the mock chain
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue({
      data: mockCarriers,
      error: null,
    });

    const { req, res } = mockRequestResponse("GET");
    await handler(req, res);

    // Verify createClient was called with req and res
    expect(mockCreateClient).toHaveBeenCalledWith(req, res);

    // Verify the Supabase chain was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith("carriers");
    expect(mockSupabase.select).toHaveBeenCalledWith("id, name");
    expect(mockSupabase.order).toHaveBeenCalledWith("name");

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockCarriers);
  });

  it("handles database errors", async () => {
    const errorMessage = "Database error";

    // Setup the mock chain with an error
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue({
      data: null,
      error: { message: errorMessage },
    });

    const { req, res } = mockRequestResponse("GET");
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: errorMessage });
  });
});
