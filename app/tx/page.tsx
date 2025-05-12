"use client";

import { sdk } from "@/lib/sdk";
import { PaymentSimple } from "@yodlpay/yapp-sdk";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Hex } from "viem";
import { Text, Card, Heading, Separator, Grid, Flex } from "@radix-ui/themes";
import truncateEthAddress from "truncate-eth-address";
import { BikeAvatar } from "@/components/BikeAvatar";
import { slots } from "@/lib/slots";
import { isValidPayment } from "@/lib/helpers";

export default function Home() {
  const [paymentDetails, setPaymentDetails] = useState<PaymentSimple | null>(
    null,
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    const txHash = searchParams.get("txHash");
    if (txHash) {
      sdk.getPayment(txHash as Hex).then((resp) => {
        if (resp) {
          setPaymentDetails(resp);
        }
      });
    }
  }, [searchParams]);

  if (!paymentDetails) {
    return <div>Loading...</div>;
  }

  const {
    memo,
    invoiceAmount,
    invoiceCurrency,
    senderAddress,
    senderEnsPrimaryName,
  } = paymentDetails;
  const date = memo.split("_")[0];
  const slot = memo.split("_")[1];

  const product = slots.find((p) => p.id === slot);
  const dt = new Date(date);

  const senderDisplayName =
    senderEnsPrimaryName || truncateEthAddress(senderAddress);

  if (!isValidPayment(paymentDetails)) {
    return <Card>Invalid payment</Card>;
  }

  return (
    <Card>
      <Grid gap="3" columns="1">
        <Flex justify="between" align="center">
          <Flex align="center" justify="start" gap="2">
            <BikeAvatar emoji={product?.emoji || "🤷"} />
            <Heading size="5" weight="light">
              Bike: #{slot}
            </Heading>
          </Flex>
          <Heading size="3" weight="light">
            ({dt.toLocaleDateString("en-US", { weekday: "long" })}) {date}
          </Heading>
        </Flex>
        <Separator size="4" />
        <Flex justify="between" align="center">
          From: {senderDisplayName}
        </Flex>
        <Text>
          {invoiceAmount} {invoiceCurrency}
        </Text>
      </Grid>
    </Card>
  );
}
