import { VercelRequest, VercelResponse } from "@vercel/node";
import { queryTransactionStatus } from "../utils/mpesa";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.error("⏳ B2C Timeout:", JSON.stringify(req.body, null, 2));

  const originatorConversationID =
    req.body?.Result?.OriginatorConversationID;

  if (originatorConversationID) {
    try {
      const statusResult = await queryTransactionStatus(originatorConversationID);
      console.log("Transaction status query result:", JSON.stringify(statusResult, null, 2));
      // Result will be delivered asynchronously to ResultURL
    } catch (err) {
      console.error("Failed to query transaction status:", err);
    }
  }

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Timeout received"
  });
}
