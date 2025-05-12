import { PaymentSimple, UserContext } from "@yodlpay/yapp-sdk";
import truncateEthAddress from "truncate-eth-address";

export function userDisplayName(userContext: UserContext | undefined | null) {
  if (!userContext) return null;

  if (userContext.primaryEnsName) {
    return userContext.primaryEnsName;
  } else {
    return truncateEthAddress(userContext.address);
  }
}

export function isValidPayment(payment: PaymentSimple) {
  // const memo = payment.memo;

  if (payment.tokenOutSymbol == "USDC") {
    return Number(payment.tokenOutAmountGross) >= 15;
  } else {
    return false;
  }
}
