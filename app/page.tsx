"use client";

import { useEffect, useState } from 'react';
import { Button, Flex, Container, Text, Card, Heading, Box, Grid, Avatar, AlertDialog, DataList, Badge, Code, IconButton, DropdownMenu, Separator, Spinner } from '@radix-ui/themes';
import YappSDK, { FiatCurrency, isInIframe, Payment, PaymentRequestData, UserContext } from '@yodlpay/yapp-sdk';
import productsData from './data/products.json';
import { YODL_ORIGIN_URL } from '@/lib/constants';
import { userDisplayName } from '@/lib/helpers';
import Link from 'next/link';
import { Cross2Icon } from '@radix-ui/react-icons';

export default function Home() {
  const { products } = productsData;

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequestData | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<Payment | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  const isEmbedded = isInIframe();

  // Initialize the SDK
  const sdk = new YappSDK({
    origin: YODL_ORIGIN_URL,
  });

  const handleBuy = async (product: any) => {
    try {

      console.log(`Initiating payment for ${product.title}`);

      // Determine the appropriate currency enum value
      const currency = product.currency === 'USD'
        ? FiatCurrency.USD
        : product.currency === 'EUR'
          ? FiatCurrency.EUR
          : FiatCurrency.USD; // Default to USD if currency not supported

      // Get the ENS or address from environment variables
      const receiverEnsOrAddress = process.env.NEXT_PUBLIC_ENS_OR_ADDRESS;

      if (!receiverEnsOrAddress) {
        throw new Error('Payment address not configured. Please set NEXT_PUBLIC_ENS_OR_ADDRESS in .env.local');
      }
      const paymentRequest = {
        addressOrEns: receiverEnsOrAddress,
        amount: product.amount,
        currency: currency,
        memo: product.id, // Unique identifier for this order        
        redirectUrl: window.location.href, // Redirect back to this page after payment
      } as PaymentRequestData;

      setPaymentRequest(paymentRequest);

      // Request payment using the Yapp SDK
      const response = await sdk.requestPayment(paymentRequest);

      setPaymentResponse(response);

      // Handle successful payment
      console.log('Payment successful:', response);
    } catch (error) {
      // Handle payment errors
      console.error('Payment error:', error);

      if (error.message === 'Payment was cancelled') {
        alert('Payment was cancelled.');
      } else {
        alert(`Payment error: ${error.message || 'Unknown error'}`);
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
  }, [setUserContext]);

  useEffect(() => {
    if (paymentResponse) {
      const { txHash, chainId } = paymentResponse;
      fetch(`https://tx.yodl.me/api/v1/payments/${txHash}?chainId=${chainId}`).then((resp) => {
        resp.json().then((data) => {
          setPaymentDetails(data.payment);
        })
      })
    }
  }, [paymentResponse]);



  const displayName = userDisplayName(userContext);

  function simulatePaymentRequest() {
    setPaymentRequest({
      addressOrEns: "foo.eth",
      amount: 100,
      currency: FiatCurrency.USD,
      memo: "hello-123"
    })
  }

  function simulatePaymentResponse() {
    const realPayment = {
      txHash: "0xe560822353a817ead3a1ab4eaec2e3fd0911017744a504c6745d16091a4032c6",
      chainId: 8453
    } as Payment;

    const realPaymentRequest = {
      addressOrEns: "foo.eth",
      amount: 450,
      currency: FiatCurrency.BRL,
    } as PaymentRequestData;

    setPaymentResponse(realPayment);
    setPaymentRequest(realPaymentRequest);
  }

  const debugBox = <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Button variant="soft">
        Simulate
        <DropdownMenu.TriggerIcon />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item onSelect={simulatePaymentRequest}>Payment Request</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={simulatePaymentResponse}>Payment Response</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  function resetPayment() {
    setPaymentResponse(null);
    setPaymentRequest(null);
    setPaymentDetails(null);

  }

  return (
    <>
      {paymentResponse && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--green-10)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={resetPayment}
        >
          <Flex direction="column" align="center" style={{ width: '100%' }} px="6">
            <Card style={{ width: '100%' }}>
              <Flex direction="column" gap="3" align="center" style={{ width: '100%' }}>
                <Flex width="100%" justify="between" align="center">
                  <Heading size="5" weight="medium">Payment Successful</Heading>
                  <IconButton color="gray" size="2" variant="ghost" onClick={resetPayment}>
                    <Cross2Icon />
                  </IconButton>
                </Flex>
                <Separator size="4" />
                {!paymentDetails &&
                  <Spinner size="3" />
                }
                {paymentDetails &&
                  <DataList.Root style={{ width: '100%' }}>
                    <DataList.Item align="center">
                      <DataList.Label minWidth="88px">Date/Time</DataList.Label>
                      <DataList.Value>
                        {new Date(paymentDetails.blockTimestamp).toLocaleString('default', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }).replace(',', '')}
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="88px">Invoice Amount</DataList.Label>
                      <DataList.Value>{paymentDetails.invoiceAmount} {paymentDetails.invoiceCurrency}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="88px">Token</DataList.Label>
                      <DataList.Value>
                        {paymentDetails.tokenOutAmountGross} {paymentDetails.tokenOutSymbol}
                      </DataList.Value>
                    </DataList.Item>
                  </DataList.Root>}
                <Button mt="4" variant="outline" color="gray" asChild>
                  <Link target="_blank" href={`https://yodl.me/tx/${paymentResponse?.txHash}`}>
                    Receipt
                  </Link>
                </Button>
              </Flex>
            </Card>
          </Flex>
        </Box>
      )}

      <Box style={{ minHeight: '100vh' }} p="6">
        <Container size="3">
          <Flex direction="column" gap="6" align="center">
            <Flex justify="between" width="100%" align="center">
              {debugBox}
              <Box>
                {isEmbedded && <Button variant="outline" size="2">
                  {displayName}
                </Button>}
              </Box>
            </Flex>

            <Box mt="6" width="100%">
              <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
                {products.map((product) => (
                  <Card key={product.id} size="2">
                    <Flex direction="column" style={{ height: '100%' }} justify="between">
                      <Box>
                        <Flex align="center" width="100%" gap="3" mb="2">
                          <Avatar
                            size="3"
                            radius="full"
                            fallback={product.emoji}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'var(--gray-3)'
                            }}
                          />
                          <Heading size="3">{product.title}</Heading>
                        </Flex>

                        <Text size="2" color="gray">{product.subtitle}</Text>
                      </Box>

                      <Box mt="3">
                        <Button
                          onClick={() => handleBuy(product)}
                          size="2"
                          style={{ width: '100%' }}
                          disabled={!!paymentRequest}
                        >
                          Buy for ${product.amount.toFixed(2)} ${product.currency}
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



export function PaymentResponse(payment: Payment, paymentRequest: PaymentRequestData) {

}