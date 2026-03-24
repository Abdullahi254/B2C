import { VercelRequest, VercelResponse } from "@vercel/node";

interface B2CResultParameter {
    Key: string;
    Value: string | number;
}

interface B2CResultBody {
    Result: {
        ResultType: number;
        ResultCode: number | string;
        ResultDesc: string;
        OriginatorConversationID: string;
        ConversationID: string;
        TransactionID?: string;
        ResultParameters?: {
            ResultParameter: B2CResultParameter[];
        };
    };
}

const B2C_RESULT_CODES: Record<string, string> = {
    "0": "Transaction successful",
    "1": "Insufficient balance",
    "2": "Below minimum transaction limit",
    "3": "Above maximum transaction limit",
    "4": "Exceeded daily transfer limit",
    "8": "Exceeded maximum account balance",
    "11": "B2C account not active",
    "21": "Initiator lacks B2C role",
    "2001": "Invalid initiator credentials",
    "2006": "Account status does not allow transaction",
    "2028": "Shortcode not permitted for B2C",
    "2040": "Recipient not supported (unregistered)",
    "8006": "Security credential locked",
    "SFC_IC0003": "Invalid phone number / operator does not exist"
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const payload: B2CResultBody = req.body;

    console.log("B2C Result Received:", JSON.stringify(payload, null, 2));

    const result = payload?.Result;
    const resultCode = String(result?.ResultCode);

    const readableMessage =
        B2C_RESULT_CODES[resultCode] || result?.ResultDesc;

    // Extract transaction parameters if available
    const parameters = result?.ResultParameters?.ResultParameter || [];

    const getParam = (key: string) =>
        parameters.find(p => p.Key === key)?.Value;

    const transactionAmount = getParam("TransactionAmount");
    const receipt = getParam("TransactionReceipt");
    const receiverName = getParam("ReceiverPartyPublicName");
    const completedAt = getParam("TransactionCompletedDateTime");
    const transactionId = result?.TransactionID;

    if (resultCode === "0") {
        // ✅ SUCCESS

        console.log("B2C SUCCESS:", {
            receipt,
            transactionAmount,
            receiverName,
            completedAt,
            transactionId,
            originatorConversationId: result.OriginatorConversationID,
        });

        // TODO:
        // - Update DB transaction as SUCCESS
        // - Match by OriginatorConversationID
        // - Store receipt & completion time

    } else {
        // ❌ FAILURE
        console.error("B2C FAILED:", {
            code: resultCode,
            message: readableMessage,
            originatorConversationId: result?.OriginatorConversationID,
        });

        // TODO:
        // - Update DB transaction as FAILED
        // - Match by OriginatorConversationID
        // - Store failure reason
    }

    /**
     * IMPORTANT:
     * Always return HTTP 200 to Safaricom
     */
    return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted"
    });

}
