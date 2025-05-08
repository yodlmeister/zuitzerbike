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
} from "@radix-ui/themes";
import {
  FiatCurrency,
  isInIframe,
  Payment,
  PaymentRequestData,
  UserContext,
} from "@yodlpay/yapp-sdk";
import productsData from "./data/products.json";
import { userDisplayName } from "@/lib/helpers";
import Link from "next/link";
import { fetchPayment, YodlPayment } from "@/lib/indexerClient";
import { sdk } from "@/lib/sdk";
import { RECIPIENT_ENS_OR_ADDRESS } from "@/lib/constants";

const { products } = productsData;

export type ProductDetails = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
};

export default function Home() {
  const receiverEnsOrAddress = RECIPIENT_ENS_OR_ADDRESS;

  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequestData | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<Payment | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<YodlPayment | null>(
    null,
  );
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  const isEmbedded = isInIframe();
  const displayName = userDisplayName(userContext);

  const handleBuy = async (product: ProductDetails) => {
    try {
      const paymentRequest = {
        addressOrEns: receiverEnsOrAddress,
        amount: product.amount,
        currency: product.currency,
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
    if (isEmbedded) {
      sdk.getUserContext().then(setUserContext);
    } else {
      setUserContext(null);
    }
  }, [setUserContext, isEmbedded]);

  useEffect(() => {
    if (paymentResponse) {
      fetchPayment(paymentResponse).then(setPaymentDetails);
    }
  }, [paymentResponse]);

  const productOrdered =
    paymentDetails && products.find((p) => p.id === paymentDetails?.memo);

  function resetPayment() {
    setPaymentResponse(null);
    setPaymentRequest(null);
    setPaymentDetails(null);
  }

  // SIMULATOR. Makes it easy to debug the payment flow.

  function simulatePaymentRequest() {
    setPaymentRequest({
      addressOrEns: "foo.eth",
      amount: products[0].amount,
      currency: FiatCurrency.USD,
      memo: products[0].id,
    });
  }

  function simulatePaymentResponse() {
    const realPayment = {
      txHash:
        "0x4c27f588024e69be35b36f925fe4926db7bea7d7335fc078899e5403fb3c4c29",
      chainId: 137,
    } as Payment;

    const realPaymentRequest = {
      addressOrEns: "foo.eth",
      amount: 1,
      currency: FiatCurrency.BRL,
    } as PaymentRequestData;

    setPaymentResponse(realPayment);
    setPaymentRequest(realPaymentRequest);
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
                          <Avatar
                            size="3"
                            radius="full"
                            fallback={productOrdered.emoji}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "var(--gray-3)",
                            }}
                          />
                          <Heading size="3">{productOrdered.title}</Heading>
                        </Flex>
                        <Text size="2" color="gray">
                          {productOrdered.subtitle}
                        </Text>
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

  return (
    <>
      <Box style={{ minHeight: "100vh" }} p="6">
        <Container size="3">
          <Flex direction="column" gap="6" align="center">
            <Flex justify="between" width="100%" align="center">
              {debugBox}
              <Box>
                {isEmbedded && (
                  <Button variant="outline" size="2">
                    {displayName}
                  </Button>
                )}
              </Box>
            </Flex>

            <Box mt="6" width="100%">
              <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
                {products.map((product) => (
                  <Card key={product.id} size="2">
                    <Flex
                      direction="column"
                      style={{ height: "100%" }}
                      justify="between"
                    >
                      <Box>
                        <Flex align="center" width="100%" gap="3" mb="2">
                          <Avatar
                            size="3"
                            radius="full"
                            fallback={product.emoji}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "var(--gray-3)",
                            }}
                          />
                          <Heading size="3">{product.title}</Heading>
                        </Flex>

                        <Text size="2" color="gray">
                          {product.subtitle}
                        </Text>
                      </Box>

                      <Box mt="3">
                        <Button
                          onClick={() => handleBuy(product)}
                          size="2"
                          style={{ width: "100%" }}
                          disabled={!!paymentRequest}
                        >
                          Buy for ${product.amount.toFixed(2)} $
                          {product.currency}
                        </Button>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </Grid>
            </Box>
          </Flex>
        </Container>
      </Box>
    </>
  );
}
