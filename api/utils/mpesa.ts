import axios from "axios";

const {
    MPESA_BASE_URL,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_INITIATOR_NAME,
    MPESA_SECURITY_CREDENTIAL,
    MPESA_SHORTCODE,
    BASE_URL
} = process.env;

/**
 * Generate Access Token
 */
export async function generateAccessToken(): Promise<string> {
    const auth = Buffer.from(
        `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers: {
                Authorization: `Basic ${auth}`
            }
        }
    );

    return response.data.access_token;
}

/**
 * Initiate B2C Payment
 */
export async function initiateB2C(
    phoneNumber: string,
    amount: number,
    remarks: string
) {
    const token = await generateAccessToken();

    const payload = {
        OriginatorConversationID: `${MPESA_SHORTCODE}_${Date.now()}`,
        InitiatorName: MPESA_INITIATOR_NAME,
        SecurityCredential: MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: amount.toString(),
        PartyA: MPESA_SHORTCODE,
        PartyB: phoneNumber,
        Remarks: remarks,
        QueueTimeOutURL: `${BASE_URL}/api/b2c/timeout`,
        ResultURL: `${BASE_URL}/api/b2c/result`,
        Occasion: "Payout"
    };

    const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/b2c/v3/paymentrequest`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

/**
 * Query Transaction Status using OriginatorConversationID
 * Use this when QueueTimeOutURL fires or callback is delayed
 */
export async function queryTransactionStatus(originatorConversationID: string) {
    const token = await generateAccessToken();

    const payload = {
        Initiator: MPESA_INITIATOR_NAME,
        SecurityCredential: MPESA_SECURITY_CREDENTIAL,
        CommandID: "TransactionStatusQuery",
        OriginatorConversationID: originatorConversationID,
        PartyA: MPESA_SHORTCODE,
        IdentifierType: "4",
        ResultURL: `${BASE_URL}/api/b2c/result`,
        QueueTimeOutURL: `${BASE_URL}/api/b2c/timeout`,
        Remarks: "Transaction status query",
        Occasion: ""
    };

    const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/transactionstatus/v1/query`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

/**
 * Register C2B URLs with Daraja
 */

interface C2BRegisterResponse {
    OriginatorConversationID: string;
    ConversationID: string;
    ResponseDescription: string;
}

export async function initiateC2B({
    confirmationURL,
    validationURL
}: {
    confirmationURL: string;
    validationURL: string;
}): Promise<C2BRegisterResponse> {
    const token = await generateAccessToken();

    const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/c2b/v2/registerurl`,
        {
            ShortCode: MPESA_SHORTCODE,
            ResponseType: "Completed",
            ConfirmationURL: confirmationURL,
            ValidationURL: validationURL,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
}
