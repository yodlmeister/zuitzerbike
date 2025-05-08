
export const RECIPIENT_ENS_OR_ADDRESS = process.env.NEXT_PUBLIC_ENS_OR_ADDRESS;

if (!RECIPIENT_ENS_OR_ADDRESS) {
  throw new Error("NEXT_PUBLIC_ENS_OR_ADDRESS is not set");
}

export const YODL_ORIGIN_URL = process.env.NEXT_PUBLIC_YODL_ORIGIN_URL || "https://yodl.me";
