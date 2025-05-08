import YappSDK from "@yodlpay/yapp-sdk";
import { YODL_ORIGIN_URL } from "./constants";

// Initialize the SDK
export const sdk = new YappSDK({
  origin: YODL_ORIGIN_URL,
});
