// pages/api/products/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { searchProducts, APIError } from "@/lib/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }

  const { query } = req.query;

  try {
    // Validate query parameter
    if (typeof query !== "string" || query.length < 4) {
      return res.status(400).json({
        message: "Query parameter must be a string with at least 4 characters",
      });
    }

    const data = await searchProducts(query);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in searchProducts API route:", error);

    if (error instanceof APIError) {
      return res.status(error.status || 500).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
