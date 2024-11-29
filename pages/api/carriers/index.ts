import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("carriers")
        .select("id, name")
        .order("name");

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error: any) {
      console.error("Error fetching carriers:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}