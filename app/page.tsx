"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Container,
  Text,
  Card,
  Heading,
  Box,
  Grid,
  Avatar,
  DataList,
  DropdownMenu,
  Separator,
  Spinner,
  Theme,
  Tooltip,
} from "@radix-ui/themes";
import {
  FiatCurrency,
  isInIframe,
  Payment,
  PaymentRequestData,
  PaymentSimple,
  UserContext,
} from "@yodlpay/yapp-sdk";
import productsData from "./data/products.json";
import { userDisplayName } from "@/lib/helpers";
import Link from "next/link";
import { fetchPayment, YodlPayment } from "@/lib/indexerClient";
import { sdk } from "@/lib/sdk";
import { RECIPIENT_ENS_OR_ADDRESS } from "@/lib/constants";
import { config } from "process";
import { BikeAvatar } from "@/components/BikeAvatar";
import { useAccount } from "wagmi";


export const slots = [
  {
    id: "1",
    amount: 15,
    emoji: "🚴"
  },
  {
    id: "2",
    amount: 15,
    emoji: "🚴‍♀️"
  },
  {
    id: "3",
    amount: 15,
    emoji: "🚴‍♂️"
  },
  {
    id: "4",
    amount: 15,
    emoji: "🚴‍♀️"
  },
  {
    id: "5",
    amount: 15,
    emoji: "🚴‍♂️"
  },
  {
    id: "6",
    amount: 15,
    emoji: "🚲"
  },
  {
    id: "7",
    amount: 15,
    emoji: "🚵🏼"
  },
  {
    id: "8",
    amount: 15,
    emoji: "🏇🏼"
  },
  {
    id: "9",
    amount: 15,
    emoji: "🚴🏿‍♀️"
  }
]


const todayStr = new Date().toISOString().split('T')[0];
const tmrwStr = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const availableDates = [
  todayStr,
  // tmrwStr
];

const currentSlots: ProductDetails[] = [];

availableDates.forEach((date) => {
  slots.forEach((slot) => {
    currentSlots.push({
      id: `${date}_${slot.id}`,
      amount: slot.amount,
      date: date,
      emoji: slot.emoji
    });
  });
});

export type ProductDetails = {
  id: string;
  amount: number;
  date: string;
  emoji: string;
};

export default function Home() {
  const receiverEnsOrAddress = RECIPIENT_ENS_OR_ADDRESS;
  const { address } = useAccount()

  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequestData | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<Payment | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<YodlPayment | null>(
    null,
  );

  const [paymentsHistory, setPaymentsHistory] = useState<PaymentSimple[]>([]);
  const [senderPaymentsHistory, setSenderPaymentsHistory] = useState<PaymentSimple[]>([]);

  const isEmbedded = isInIframe();

  const handleBuy = async (product: ProductDetails) => {
    try {
      const paymentRequest = {
        addressOrEns: receiverEnsOrAddress,
        amount: product.amount,
        currency: FiatCurrency.USD,
        memo: product.id, // Unique identifier for this order
        // redirectUrl only required when running standalone
        redirectUrl: isEmbedded ? undefined : window.location.href,
      } as PaymentRequestData;

      setPaymentRequest(paymentRequest);

      // Request payment using the Yapp SDK
      const response = await sdk.requestPayment(paymentRequest);

      setPaymentResponse(response);

      // Handle successful payment
      console.log("Payment successful:", response);
    } catch (error) {
      // Handle payment errors
      console.error("Payment error:", error);

      if (error instanceof Error) {
        if (error.message === "Payment was cancelled") {
          alert("Payment was cancelled.");
        } else {
          alert(`Payment error: ${error.message || "Unknown error"}`);
        }
      }
    } finally {
      setPaymentRequest(null);
    }
  };

  useEffect(() => {
    if (paymentResponse) {
      fetchPayment(paymentResponse).then(setPaymentDetails);
    }
  }, [paymentResponse]);


  const productOrdered =
    paymentDetails && currentSlots.find((p) => p.id === paymentDetails?.memo);

  function resetPayment() {
    setPaymentResponse(null);
    setPaymentRequest(null);
    setPaymentDetails(null);
  }

  // SIMULATOR. Makes it easy to debug the payment flow.

  function simulatePaymentRequest() {
    setPaymentRequest({
      addressOrEns: "foo.eth",
      amount: currentSlots[0].amount,
      currency: FiatCurrency.USD,
      memo: currentSlots[0].id,
    });
  }

  function simulatePaymentResponse() {
    const realPayment = {
      txHash:
        "0x793cc2b237a69636e7c7cffed6d57cd9a25dd3a399a83e2d3ad1443b04cadd7b",
      chainId: 8453,
    } as Payment;

    const realPaymentRequest = {
      addressOrEns: "foo.eth",
      amount: 1,
      currency: FiatCurrency.BRL,
    } as PaymentRequestData;

    setPaymentResponse(realPayment);
    setPaymentRequest(realPaymentRequest);
  }

  useEffect(() => {
    sdk.getPayments({ perPage: 100 }).then((resp) => {
      if ('payments' in resp) {
        setPaymentsHistory(resp.payments);
      }
    });
  }, [])

  useEffect(() => {
    sdk.getPayments({ perPage: 1, sender: address, receiver: receiverEnsOrAddress }).then((resp) => {
      if ('payments' in resp) {
        setSenderPaymentsHistory(resp.payments);
      }
    });
  }, [address])

  function slotBooked(slot: ProductDetails) {
    return paymentsHistory.some((p) => p.memo === slot.id);
  }

  const debugBox = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft">
          Simulate
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={simulatePaymentRequest}>
          Payment Request
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={simulatePaymentResponse}>
          Payment Response
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );

  if (paymentResponse) {
    return (
      <Theme accentColor="green">
        <Box
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--green-a7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={resetPayment}
        >
          <Flex
            direction="column"
            align="center"
            style={{ width: "100%" }}
            px="6"
          >
            <Box
              style={{
                width: "100%",
              }}
            >
              <Flex
                direction="column"
                gap="3"
                align="center"
                style={{ width: "100%" }}
              >
                <Flex width="100%" justify="center" align="center">
                  <Heading size="5" weight="medium">
                    Payment Successful
                  </Heading>
                </Flex>
                {!paymentDetails && <Spinner size="3" />}

                {productOrdered && (
                  <Card variant="surface" style={{ width: "100%" }}>
                    <Flex
                      p="2"
                      direction="column"
                      style={{ height: "100%" }}
                      justify="between"
                    >
                      <Box>
                        <Flex align="center" width="100%" gap="3" mb="2">
                          <BikeAvatar emoji={productOrdered.emoji} />
                          <Heading size="3">{productOrdered.date}</Heading>
                        </Flex>

                      </Box>
                    </Flex>
                  </Card>
                )}
                {paymentDetails && (
                  <Card variant="ghost">
                    <DataList.Root style={{ width: "100%" }}>
                      <DataList.Item align="center">
                        <DataList.Label minWidth="88px">
                          Date/Time
                        </DataList.Label>
                        <DataList.Value>
                          {new Date(paymentDetails.blockTimestamp)
                            .toLocaleString("default", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })
                            .replace(",", "")}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label minWidth="88px">
                          Invoice Amount
                        </DataList.Label>
                        <DataList.Value>
                          {paymentDetails.invoiceAmount}{" "}
                          {paymentDetails.invoiceCurrency}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label minWidth="88px">Token</DataList.Label>
                        <DataList.Value>
                          {paymentDetails.tokenOutAmountGross}{" "}
                          {paymentDetails.tokenOutSymbol}
                        </DataList.Value>
                      </DataList.Item>
                    </DataList.Root>
                  </Card>
                )}
                <Separator size="2" mb="1" />
                <Grid columns="2" gap="2">
                  <Button variant="outline" color="gray" asChild>
                    <Link
                      style={{ textDecoration: "none", color: "inherit" }}
                      target="_blank"
                      href={`https://yodl.me/tx/${paymentResponse?.txHash}`}
                    >
                      Receipt
                    </Link>
                  </Button>
                  <Button variant="outline" color="gray" onClick={resetPayment}>
                    Close
                  </Button>
                </Grid>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Theme>
    );
  }


  function SenderPaymentsHistory() {
    if (!senderPaymentsHistory) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const upcoming = senderPaymentsHistory.filter((p) => {
      const date = p.memo.split("_")[0];
      return date >= today;
    })

    return (
      <Grid columns="1" gap="3" align="center" width="100%">
        <Heading size="3" weight="medium">My Bookings</Heading>
        {upcoming.map((p) => (
          <Link key={p.txHash}
            style={{ textDecoration: "none", color: "inherit" }}
            href={`/tx?txHash=${p.txHash}&chainId=${p.chainId}`}>
            <Card>
              <Flex direction="row" align="center" justify="between" width="100%">
                <Flex><Text>Bike: #{p.memo.split("_")[1]}</Text></Flex>
                <Flex><Text>{p.memo.split("_")[0]}</Text></Flex>
              </Flex>
            </Card>
          </Link>
        ))
        }
        {upcoming.length === 0 && <Text weight="light" color="gray">No upcoming bookings</Text>}
      </Grid >
    )
  }

  return (

    <Grid columns="1" align="center">
      <SenderPaymentsHistory />
      <Box mt="6" width="100%">
        {availableDates.map((date) => {
          return (
            <Grid key={date} columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
              <Flex justify="between">
                <Heading size="3" weight="medium" style={{ textAlign: "center" }}>Booking</Heading>
                <Heading size="3" weight="medium" style={{ textAlign: "center" }}>{date}</Heading>
              </Flex>

              {
                currentSlots.filter((slot) => slot.date === date).map((slot, idx) => (
                  <Tooltip key={slot.id} content={slot.id}>
                    <Button
                      key={slot.id}
                      onClick={() => handleBuy(slot)}
                      size="3"
                      style={{ width: "100%" }}
                      disabled={!!paymentRequest || slotBooked(slot)}
                    >
                      <Avatar
                        size="2"
                        radius="full"
                        fallback={slot.emoji}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                      Rent for ${slot.amount.toFixed(2)}
                    </Button>
                  </Tooltip>
                ))
              }
            </Grid>
          )
        })}
      </Box>
      <Flex justify="between" mt="9" width="100%" align="center">
        {debugBox}
      </Flex>
    </Grid>

  );
}


