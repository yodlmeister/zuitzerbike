"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Flex,
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
  Callout,
  VisuallyHidden,
} from "@radix-ui/themes";
import {
  FiatCurrency,
  isInIframe,
  Payment,
  PaymentRequestData,
  PaymentSimple,
} from "@yodlpay/yapp-sdk";
import Link from "next/link";
import { fetchPayment, YodlPayment } from "@/lib/indexerClient";
import { sdk } from "@/lib/sdk";
import { INTRAZUITZ_URL, RECIPIENT_ENS_OR_ADDRESS } from "@/lib/constants";
import { BikeAvatar } from "@/components/BikeAvatar";
import { useAccount } from "wagmi";
import { slots } from "@/lib/slots";
import { IntrazuitzClient } from "@/lib/intrazuitzClient";
import { Link2Icon, LinkNone2Icon } from "@radix-ui/react-icons";
import { isValidPayment } from "@/lib/helpers";

const todayStr = new Date().toISOString().split("T")[0];

let intrazuitzClient: IntrazuitzClient | null = null;
if (INTRAZUITZ_URL) {
  intrazuitzClient = new IntrazuitzClient(INTRAZUITZ_URL);
}

// Generate dates from today until cutoff date (May 23, 2025)
function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

const cutoffDate = new Date("2025-05-27");
const availableDates = generateDateRange(new Date(), cutoffDate);

const currentSlots: ProductDetails[] = [];

availableDates.forEach((date) => {
  slots.forEach((slot) => {
    currentSlots.push({
      id: `${date}_${slot.id}`,
      amount: slot.amount,
      date: date,
      emoji: slot.emoji,
    });
  });
});

type ProductDetails = {
  id: string;
  amount: number;
  date: string;
  emoji: string;
};

export default function Home() {
  const receiverEnsOrAddress = RECIPIENT_ENS_OR_ADDRESS;
  const { address } = useAccount();

  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequestData | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<Payment | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<YodlPayment | null>(
    null,
  );

  const [isIntraZuitz, setIntraZuitz] = useState<boolean | null>(null);

  const [paymentsHistory, setPaymentsHistory] = useState<PaymentSimple[]>([]);
  const [senderPaymentsHistory, setSenderPaymentsHistory] = useState<
    PaymentSimple[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isEmbedded = isInIframe();

  function applyIntraZuitzDiscount(amount: number) {
    if (isIntraZuitz) {
      return 5;
    } else {
      return amount;
    }
  }

  const handleBuy = async (product: ProductDetails) => {
    try {
      // memo: date_slot(_discount)
      // parse: [date, slot, discount] = memo.split("_")

      const memo = isIntraZuitz ? `${product.id}_vpn` : product.id;

      const paymentRequest = {
        addressOrEns: process.env.NEXT_PUBLIC_ENS,
        amount: applyIntraZuitzDiscount(product.amount),
        currency: FiatCurrency.USD,
        memo, // Unique identifier for this order
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
    sdk
      .getPayments({ receiver: RECIPIENT_ENS_OR_ADDRESS, perPage: 100 })
      .then((resp) => {
        if ("payments" in resp) {
          setPaymentsHistory(resp.payments.filter(isValidPayment));
        }
      });
  }, []);

  useEffect(() => {
    if (!address) return;

    sdk
      .getPayments({
        perPage: 20,
        sender: address,
        receiver: receiverEnsOrAddress,
      })
      .then((resp) => {
        if ("payments" in resp) {
          setSenderPaymentsHistory(resp.payments.filter(isValidPayment));
        }
      });
  }, [address, receiverEnsOrAddress]);

  function slotBooked(slot: ProductDetails) {
    return paymentsHistory.some(
      (p) => p.memo === slot.id || p.memo === `${slot.id}_vpn`,
    );
  }

  useEffect(() => {
    if (intrazuitzClient) {
      intrazuitzClient.isZuitzerland().then(setIntraZuitz);
    }
  }, []);

  const debugBox = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost">
          Debugging
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

    const today = new Date().toISOString().split("T")[0];
    const upcoming = senderPaymentsHistory.filter((p) => {
      const date = p.memo.split("_")[0];
      return date >= today;
    });

    return (
      <Grid columns="1" gap="3" align="center" width="100%">
        <Heading size="3" weight="medium">
          My Bookings
        </Heading>
        {upcoming.map((p) => (
          <Link
            key={p.txHash}
            style={{ textDecoration: "none", color: "inherit" }}
            href={`/tx?txHash=${p.txHash}&chainId=${p.chainId}`}
          >
            <Card>
              <Flex
                direction="row"
                align="center"
                justify="between"
                width="100%"
              >
                <Flex>
                  <Text>Bike: #{p.memo.split("_")[1]}</Text>
                </Flex>
                <Flex>
                  <Text>{p.memo.split("_")[0]}</Text>
                </Flex>
              </Flex>
            </Card>
          </Link>
        ))}
        {upcoming.length === 0 && (
          <Text weight="light" color="gray">
            You have no upcoming bookings
          </Text>
        )}
      </Grid>
    );
  }

  // Format date for display (e.g., May 15, 2025)
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <Grid columns="1" align="center">
      <SenderPaymentsHistory />
      <Box mt="6" width="100%">
        <Grid columns={{ initial: "1", sm: "1", md: "1" }} gap="4">
          {isIntraZuitz && (
            <Callout.Root color="green">
              <Callout.Icon>
                <Link2Icon />
              </Callout.Icon>
              <Callout.Text>IntraZuitz discount applied.</Callout.Text>
            </Callout.Root>
          )}

          {INTRAZUITZ_URL && !isIntraZuitz && (
            <Callout.Root color="gray">
              <Callout.Icon>
                <LinkNone2Icon />
              </Callout.Icon>
              <Callout.Text>
                Connect to tailscale for IntraZuitz discount.
              </Callout.Text>
            </Callout.Root>
          )}

          <Flex justify="between" align="center">
            <Heading size="3" weight="medium">
              Booking
            </Heading>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="soft">
                  {formatDateForDisplay(selectedDate)}
                  <DropdownMenu.TriggerIcon />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {availableDates.slice(0, 30).map((date) => (
                  <DropdownMenu.Item
                    key={date}
                    onSelect={() => setSelectedDate(date)}
                  >
                    {formatDateForDisplay(date)}
                  </DropdownMenu.Item>
                ))}
                {availableDates.length > 30 && <DropdownMenu.Separator />}
                {availableDates.length > 30 && (
                  <DropdownMenu.Item
                    onSelect={() =>
                      setSelectedDate(availableDates[availableDates.length - 1])
                    }
                  >
                    Last day:{" "}
                    {formatDateForDisplay(
                      availableDates[availableDates.length - 1],
                    )}
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>

          <Grid columns={{ initial: "1", sm: "1", md: "1" }} gap="4">
            {currentSlots
              .filter((slot) => slot.date === selectedDate)
              .map((slot) => (
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
                    Rent for ${applyIntraZuitzDiscount(slot.amount).toFixed(2)}
                  </Button>
                </Tooltip>
              ))}
          </Grid>
        </Grid>
      </Box>
      <VisuallyHidden>
        <Flex justify="between" mt="9" width="100%" align="center">
          {debugBox}
        </Flex>
      </VisuallyHidden>
    </Grid>
  );
}
