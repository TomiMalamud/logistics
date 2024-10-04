// pages/api/notes.ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase"; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { delivery_id, text } = req.body;

    // Validate request body
    if (!delivery_id || !text) {
      return res.status(400).json({ error: "Missing delivery_id or text" });
    }

    try {
      // Insert the new note into the 'notes' table
      const { data, error } = await supabase
        .from("notes")
        .insert([{ text, delivery_id }])
        .select("*");

      if (error) {
        throw error;
      }

      res.status(200).json({ message: "Note created successfully", data });
    } catch (error: any) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
