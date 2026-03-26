import { VercelRequest, VercelResponse } from "@vercel/node";
import { initiateB2C } from "../utils/mpesa.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { phoneNumber, amount, remarks } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({
        message: "phoneNumber and amount are required"
      });
    }

    const result = await initiateB2C(
      phoneNumber,
      amount,
      remarks || "B2C Payment"
    );

    return res.status(200).json({
      message: "B2C request sent",
      data: result
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to initiate B2C",
      error: error.message
    });
  }
}
