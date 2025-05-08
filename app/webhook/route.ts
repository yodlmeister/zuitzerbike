import {
  verifiedJson,
  WebhookVerificationError,
} from "@/lib/yodl/webhookSignature";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles incoming webhooks from Yodl
 *
 * @route POST /webhook
 * @description Receives and verifies webhook payloads from Yodl
 *
 * @param {string} req.headers.get('x-yodl-signature') - The signature of the webhook payload
 * @param {Object} req.json() - The webhook payload including txHash, chainId, paymentIndex
 *
 * @returns {Response} 200 - Webhook processed successfully
 * @returns {Response} 400 - Invalid webhook signature or payload
 * @returns {Response} 500 - Server error during processing
 */
export async function POST(req: NextRequest) {
  try {
    const body = await verifiedJson(req);

    console.log(body);

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    } else {
      return NextResponse.json({ error: "SystemFailure" }, { status: 500 });
    }
  }
}
