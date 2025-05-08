import { Payment } from "@yodlpay/yapp-sdk";

export type PaymentResponse = {
  payment: YodlPayment;
};

export type YodlPayment = {
  chainId: number;
  txHash: string;
  paymentIndex: number;
  blockTimestamp: string;

  tokenOutSymbol: string;
  tokenOutAddress: string;
  tokenOutAmountGross: string;

  receiverAddress: string;
  receiverEnsPrimaryName: string;
  receiverYodlConfig: object;

  invoiceCurrency: string;
  invoiceAmount: string;

  senderAddress: string;
  senderEnsPrimaryName: string;
  memo: string;
};

export async function fetchPayment(paymentResponse: Payment): Promise<YodlPayment> {
  const { txHash, chainId } = paymentResponse;
  const response = await fetch(`https://tx.yodl.me/api/v1/payments/${txHash}?chainId=${chainId}`);
  const data = await response.json();
  return data.payment;
}
