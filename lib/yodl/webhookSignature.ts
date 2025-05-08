import { YODL_SIGNING_ADDRESS } from "@/lib/constants";
import { NextRequest } from "next/server";
import { Hex, isHex, verifyMessage } from "viem";

export class WebhookVerificationError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "WebhookVerificationError";
    this.status = status;
  }
}

/**
 * Verifies the signature of the webhook payload from the central Yodl Indexer.
 *
 * The Yodl Indexer is a service that indexes all Yodl transactions and events.
 *
 * It signs all webhook payloads with the address that you can find on:
 *
 *     https://app.ens.domains/webhooks.yodl.eth
 *
 * @param req
 * @returns
 */
export async function verifiedJson(req: NextRequest) {
  if (!YODL_SIGNING_ADDRESS) {
    throw new WebhookVerificationError(
      "YODL_SIGNING_ADDRESS address is not set",
      500,
    );
  }

  const body = await req.json();
  const message = JSON.stringify(body);

  const signature = req.headers.get("x-yodl-signature");

  if (!signature || !isHex(signature)) {
    throw new WebhookVerificationError("Missing or invalid signature");
  }

  const isValid = await verifyMessage({
    message,
    signature: signature as Hex,
    address: YODL_SIGNING_ADDRESS as Hex,
  });

  if (isValid) {
    return body;
  } else {
    throw new WebhookVerificationError("Signature verification failed");
  }
}
