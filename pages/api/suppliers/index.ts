// pages/api/suppliers.ts
import { NextApiRequest, NextApiResponse } from "next";
import createClient from "@/lib/utils/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const supabase = createClient(req, res);
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}